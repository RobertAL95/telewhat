'use client';
import { useEffect, useRef } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext'; // 🟢 CORRECCIÓN: Importamos el contexto de sesión correcto
import { connectWS } from '@/libs/wsClient'; 
import { loadMessages, saveMessageLocally } from '@/libs/localChatStore';
import { apiFetch } from '@/libs/apiClient';
import { decryptMessageBatch } from '@/utils/crypto';

export function useChatWS() {
  const { state, dispatch } = useGlobal();
  const { activeChatId } = state; // 🟢 CORRECCIÓN: Extraemos solo lo que le pertenece a GlobalState
  const { user } = useAuth();     // 🟢 CORRECCIÓN: Consumimos la sesión desde AuthContext de forma limpia
  
  const joinedRef = useRef<string | null>(null);

  // ============================================================
  // 🟢 1. BUZÓN INTELIGENTE: Persistencia Híbrida y Sincronización Delta
  // ============================================================
  useEffect(() => {
    if (!activeChatId || !user?.id) return;

    const orchestrateOfflineFirstSync = async () => {
      try {
        // Paso A: Carga en frío ultrarrápida desde disco local (IndexedDB)
        const localCachedMsgs = await loadMessages(activeChatId);
        
        if (localCachedMsgs.length > 0) {
          dispatch({
            type: 'LOAD_MESSAGES',
            payload: { chatId: activeChatId, msgs: localCachedMsgs }
          });
        }

        // Paso B: Determinar el delta (¿Cuál es el último mensaje que poseo?)
        const lastMessageId = localCachedMsgs[localCachedMsgs.length - 1]?._id;
        
        // Construimos url delta dinámica: si tengo mensajes pido solo los nuevos desde sinceId
        const syncUrl = lastMessageId 
          ? `/chat/${activeChatId}/messages?sinceId=${lastMessageId}` 
          : `/chat/${activeChatId}/messages`;

        console.log(`📡 Sincronización Delta iniciada. Destino: ${syncUrl}`);
        const resMessages = await apiFetch(syncUrl);
        const messagesList = Array.isArray(resMessages) ? resMessages : (resMessages?.body || resMessages?.data || []);

        if (messagesList.length > 0) {
          // Desciframos criptográficamente solo los mensajes nuevos (El delta)
          const clearNewMessages = await decryptMessageBatch(messagesList, state.unlockedPrivateKey);

          // Persistimos en IndexedDB de fondo para la siguiente sesión en frío
          await Promise.all(clearNewMessages.map(msg => saveMessageLocally(activeChatId, msg)));

          // Fusionamos el delta con el estado global de la memoria de React
          dispatch({
            type: 'SET_MESSAGES',
            payload: { 
              chatId: activeChatId, 
              messages: lastMessageId ? [...localCachedMsgs, ...clearNewMessages] : clearNewMessages 
            }
          });
        }
      } catch (error) {
        console.error("❌ useChatWS: Falló la sincronización delta del pipeline:", error);
      }
    };

    orchestrateOfflineFirstSync();
    
  }, [activeChatId, user?.id, state.unlockedPrivateKey, dispatch]);

  // ============================================================
  // 🔵 2. WEBSOCKET: Mensajería en Tiempo Real con Autoguardado Local
  // ============================================================
  useEffect(() => {
    if (!activeChatId || !user?.id) return;

    console.log(`🚀 Hook WS montado para Chat: ${activeChatId}`);

    const handleIncomingMessage = async (incomingData: any) => {
        // 1. Mensajes de Sistema
        if (incomingData.system || incomingData.type === 'user_joined') {
            const joinName = incomingData.userName || incomingData.payload?.userName || 'El invitado';
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    chatId: activeChatId,
                    msg: { from: 'system', text: `💬 ${joinName} se ha unido.`, timestamp: Date.now(), isSelf: false }
                }
            });
            return;
        }

        // 2. Mensajes de Texto o Multimedia entrantes
        if (incomingData.type === 'message' || incomingData.text || incomingData.payload?.media) {
            const data = incomingData.payload || incomingData;
            if (!data.text && !data.media) return;
            if (data.from === user.id) return; // Cortocircuito anti-eco

            const rawMsg = {
                _id: data._id || Date.now().toString(),
                from: data.from,
                text: data.text || '',
                media: data.media || null, 
                timestamp: data.timestamp || Date.now(),
                name: data.name,
                senderModel: data.senderModel,
                isSelf: false 
            };

            // Inyección inmediata en base de datos local asíncrona (IndexedDB)
            await saveMessageLocally(activeChatId, rawMsg);

            dispatch({
                type: 'ADD_MESSAGE',
                payload: { chatId: activeChatId, msg: rawMsg },
            });
        }
    };

    let socket = connectWS(null, handleIncomingMessage);
    if (!socket) {
        console.error("❌ Fatal: No se pudo obtener instancia del socket.");
        return; 
    }

    socket.onmessage = (event) => {
        try {
            const parsed = JSON.parse(event.data);
            handleIncomingMessage(parsed);
        } catch(e) { console.error("Error parseando WS", e); }
    };

    const sendJoinPacket = () => {
        if (joinedRef.current === activeChatId) return; 
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log(`📡 Enviando JOIN_CHAT para ${activeChatId}...`);
            socket.send(JSON.stringify({ 
                type: 'join_chat', 
                chatId: activeChatId,
                userId: user.id 
            }));
            joinedRef.current = activeChatId;
        }
    };

    if (socket.readyState === WebSocket.OPEN) {
        sendJoinPacket();
    } else {
        const originalOnOpen = socket.onopen;
        socket.onopen = (event) => {
            if (originalOnOpen) originalOnOpen.call(socket, event);
            sendJoinPacket();
        };
    }

    return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'leave_chat', chatId: activeChatId }));
        }
        joinedRef.current = null;
        if (socket) socket.onmessage = null; 
    };

  }, [activeChatId, user?.id, dispatch]);
}