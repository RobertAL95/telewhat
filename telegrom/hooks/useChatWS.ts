import { useEffect, useRef } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { connectWS } from '@/libs/wsClient'; 

export function useChatWS() {
  const { state, dispatch } = useGlobal();
  const { activeChatId, user } = state;
  // Ref para evitar joins duplicados en renderizados rápidos
  const joinedRef = useRef<string | null>(null);

  // ============================================================
  // 🟢 1. BUZÓN INTELIGENTE: CARGAR EL HISTORIAL (Sincronización BD)
  // ============================================================
  useEffect(() => {
    if (!activeChatId || !user) return;

    const fetchChatHistory = async () => {
      try {
        // Obtenemos el token
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');

        // 🔥 CORRECCIÓN AQUÍ: Agregamos /api y usamos 'chat' en singular
        const response = await fetch(`/api/chat/${activeChatId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
           const errText = await response.text();
           throw new Error(`Error al conectar con la base de datos: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        // Si llegaron los mensajes, usamos TU acción 'LOAD_MESSAGES'
        if (!data.error && data.body) {
          dispatch({
            type: 'LOAD_MESSAGES', 
            payload: {
              chatId: activeChatId,
              msgs: data.body // Array de mensajes históricos
            }
          });
        }
      } catch (error) {
        console.error("❌ Error cargando el historial del chat:", error);
      }
    };

    // Solo cargamos el historial si aún no tenemos mensajes para este chat en memoria
    if (!state.messages[activeChatId] || state.messages[activeChatId].length === 0) {
       fetchChatHistory();
    }
    
  }, [activeChatId, user?.id, dispatch, state.messages]);

  // ============================================================
  // 🔵 2. WEBSOCKET: MENSAJES EN TIEMPO REAL
  // ============================================================
  useEffect(() => {
    // Guardias
    if (!activeChatId || !user) return;

    console.log(`🚀 Hook WS montado para Chat: ${activeChatId}`);

    // A. Manejador de mensajes entrantes
    const handleIncomingMessage = (incomingData: any) => {
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

        // 2. Mensajes de Texto o Multimedia
        if (incomingData.type === 'message' || incomingData.text || incomingData.payload?.media) {
            const data = incomingData.payload || incomingData;
            
            if (!data.text && !data.media) return;

            // Filtro anti-eco (No añadir el mensaje si es mío)
            if (data.from === user.id) return; 

            dispatch({
                type: 'ADD_MESSAGE',
                payload: { 
                    chatId: activeChatId, 
                    msg: {
                        _id: data._id || Date.now().toString(),
                        from: data.from,
                        text: data.text || '',
                        media: data.media || null, 
                        timestamp: data.timestamp || Date.now(),
                        name: data.name,
                        senderModel: data.senderModel,
                        isSelf: false 
                    }
                },
            });
        }
    };

    // B. Obtener Conexión (Singleton)
    let socket = connectWS(null, handleIncomingMessage);

    if (!socket) {
        console.error("❌ Fatal: No se pudo obtener instancia del socket.");
        return; 
    }

    // Sobrescribimos onmessage para este chat
    socket.onmessage = (event) => {
        try {
            const parsed = JSON.parse(event.data);
            handleIncomingMessage(parsed);
        } catch(e) { console.error("Error parseando WS", e); }
    };

    // C. Protocolo de Unión a la Sala (Room)
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

    // Inteligencia de espera del socket
    if (socket.readyState === WebSocket.OPEN) {
        sendJoinPacket();
    } else {
        const originalOnOpen = socket.onopen;
        socket.onopen = (event) => {
            if (originalOnOpen) originalOnOpen.call(socket, event);
            sendJoinPacket();
        };
    }

    // D. Limpieza al salir del chat
    return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'leave_chat', chatId: activeChatId }));
        }
        joinedRef.current = null;
        if (socket) socket.onmessage = null; 
    };

  }, [activeChatId, user?.id, dispatch]);
}