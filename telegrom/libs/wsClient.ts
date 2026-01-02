'use client';

// Nota: No usamos useRouter aquí porque esto no es un componente React.
// Usaremos window.location para redirecciones forzadas.

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentChatId: string | null = null; 
let currentOnMessage: ((msg: any) => void) | null = null;

const AUTH_CLOSE_CODES = [4001, 4003]; 

// ===================================================
// ⚙️ Config utilitario para URL base
// ===================================================
function getWSUrl(chatId?: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; 
  return chatId 
    ? `${protocol}//${host}/ws?roomId=${chatId}`
    : `${protocol}//${host}/ws`; 
}

// ===================================================
// 🟢 Conectar al WebSocket
// ===================================================
export function connectWS(
  chatId: string | null, 
  onMessage: (msg: any) => void
): WebSocket | null {
  
  if (reconnectTimer) clearTimeout(reconnectTimer);

  if (socket && currentChatId === chatId && socket.readyState === WebSocket.OPEN) {
      console.log('⚡ WS ya conectado, reutilizando conexión.');
      currentOnMessage = onMessage; 
      return socket;
  }

  if (socket) {
    try {
      socket.close();
    } catch {}
    socket = null;
  }
  
  currentChatId = chatId;
  currentOnMessage = onMessage;

  const wsUrl = getWSUrl(chatId || undefined);
  
  console.log(`⚙️ Intentando conectar WS → ${wsUrl}`);

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      reconnectAttempts = 0; 
      console.log('🟢 WebSocket conectado →', wsUrl);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (currentOnMessage) {
            currentOnMessage(data); 
        }
      } catch (err) {
        console.error('❌ Error al procesar mensaje WS:', err);
      }
    };

    socket.onclose = (event) => {
      console.warn(`🔴 WS desconectado (${event.code})`);
      socket = null;

      if (AUTH_CLOSE_CODES.includes(event.code)) {
        console.error(`❌ WS Sesión Inválida. Redirigiendo...`);
        if (currentOnMessage) currentOnMessage({ system: true, type: 'AUTH_FAILED' });
        deleteSessionAndRedirect(); 
        return; 
      }

      if (![1000, 1001].includes(event.code)) {
        scheduleReconnect(chatId, onMessage);
      }
    };

    socket.onerror = (err) => {
      console.error('⚠️ Error en WebSocket:', err);
    };

    return socket;
  } catch (e) {
    console.error('❌ Error al conectar WebSocket:', e);
    scheduleReconnect(chatId, onMessage);
    return null;
  }
}

// ===================================================
// 🔍 Obtener Instancia (LA FUNCIÓN QUE FALTABA)
// ===================================================
export function getSocket() {
    return socket;
}

// ===================================================
// 🚪 Unirse a Sala Manualmente (Reemplazo de .emit)
// ===================================================
export function joinRoom(chatId: string) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ No se puede unir a sala: WS desconectado');
        return;
    }
    // En WS nativo enviamos JSON, no existe .emit()
    socket.send(JSON.stringify({ type: 'join_chat', chatId }));
    console.log(`🔌 Enviado join_chat para: ${chatId}`);
}

// ===================================================
// 🔁 Reconexión automática
// ===================================================
function scheduleReconnect(chatId: string | null, onMessage: (msg: any) => void) {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  reconnectAttempts++;
  const delay = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts - 1));

  console.warn(`⏳ Intentando reconexión #${reconnectAttempts} en ${delay / 1000}s...`);

  reconnectTimer = setTimeout(() => {
    connectWS(chatId, onMessage);
  }, delay);
}

// ===================================================
// ✉️ Enviar mensaje
// ===================================================
export function sendMessage(text: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('⚠️ No hay conexión WS activa, mensaje no enviado.');
    return;
  }
  
  if (!currentChatId) {
      console.warn('🚫 No puedes enviar mensajes desde el Lobby.');
      return;
  }

  const payload = JSON.stringify({ type: 'message', text });
  socket.send(payload);
  console.log('📤 Mensaje enviado:', text);
}

// ===================================================
// 🔴 Cerrar conexión manualmente
// ===================================================
export function disconnectWS() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    try {
      socket.close(1000, 'Cierre manual del cliente');
    } catch {}
    socket = null;
    currentChatId = null; 
    console.log('🔴 WS cerrado manualmente');
  }
}

export function deleteSessionAndRedirect() {
    disconnectWS();
    if (typeof window !== 'undefined') {
        window.location.href = '/auth';
    }
}