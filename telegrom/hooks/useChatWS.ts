import { useEffect, useRef } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { connectWS } from '@/libs/wsClient'; 

export function useChatWS() {
  const { state, dispatch } = useGlobal();
  const { activeChatId, user } = state;
  // Ref para evitar joins duplicados en renderizados rápidos
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Guardias: Si no hay chat activo o usuario, no hacemos nada
    if (!activeChatId || !user) return;

    console.log(`🚀 Hook WS montado para Chat: ${activeChatId}`);

    // ============================================================
    // A. Definir manejador de mensajes
    // ============================================================
    const handleIncomingMessage = (incomingData: any) => {
        // Log para depuración
        // console.log("📩 Mensaje recibido en Hook:", incomingData);

        // 1. Mensajes de Sistema (Alguien entró, etc)
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

        // 2. Mensajes de Texto Normales
        if (incomingData.type === 'message' || incomingData.text) {
            const data = incomingData.payload || incomingData;
            
            // Validación básica
            if (!data.text) return;

            dispatch({
                type: 'ADD_MESSAGE',
                payload: { 
                    chatId: activeChatId, 
                    msg: {
                        from: data.from, // ID del remitente
                        text: data.text,
                        timestamp: data.timestamp || Date.now(),
                        name: data.name,
                        // Calculamos si es mensaje propio
                        isSelf: data.from === user.id 
                    }
                },
            });
        }
    };

    // ============================================================
    // B. Obtener Conexión (Singleton)
    // ============================================================
    
    // connectWS maneja si devolver una existente o crear nueva
    let socket = connectWS(null, handleIncomingMessage);

    // 🛑 GUARDIA CRÍTICA (Soluciona el error "Object possibly null") 🛑
    if (!socket) {
        console.error("❌ Fatal: No se pudo obtener instancia del socket.");
        return; 
    }

    // Sobrescribimos el onmessage para este chat específico
    socket.onmessage = (event) => {
        try {
            const parsed = JSON.parse(event.data);
            handleIncomingMessage(parsed);
        } catch(e) { console.error("Error parseando WS", e); }
    };

    // ============================================================
    // C. Protocolo de Unión (Soluciona la "Unidireccionalidad")
    // ============================================================
    const sendJoinPacket = () => {
        // Evitar unirse dos veces a la misma sala seguidas
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

    // Lógica Inteligente de Espera
    if (socket.readyState === WebSocket.OPEN) {
        // Escenario A: Socket ya listo -> Enviar de una
        sendJoinPacket();
    } else {
        // Escenario B: Socket conectando -> Esperar evento 'open'
        console.log("⏳ Socket conectando... esperando apertura para hacer Join.");
        const originalOnOpen = socket.onopen;
        socket.onopen = (event) => {
            // Mantener lógica original si existía (auth, etc)
            if (originalOnOpen) originalOnOpen.call(socket, event);
            
            console.log("✅ Socket Abierto. Ejecutando Join diferido.");
            sendJoinPacket();
        };
    }

    // ============================================================
    // D. Limpieza al salir del componente
    // ============================================================
    return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Avisar al server que salimos de la sala (opcional, pero buena práctica)
            socket.send(JSON.stringify({ type: 'leave_chat', chatId: activeChatId }));
        }
        joinedRef.current = null;
        // No cerramos el socket (disconnectWS) porque el usuario puede volver al lobby
        if (socket) socket.onmessage = null; 
    };

  }, [activeChatId, user?.id, dispatch]);
}