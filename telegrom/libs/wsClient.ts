'use client';

// Nota: No usamos useRouter aquí porque esto no es un componente React.
// Usaremos window.location para redirecciones forzadas.

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentChatId: string | null = null; // ✅ Ahora permite null (Lobby)
let currentOnMessage: ((msg: any) => void) | null = null;

// Códigos de cierre de seguridad que requieren el logout forzado
const AUTH_CLOSE_CODES = [4001, 4003]; // 4001: Token Inválido / 4003: ACL Fallida

// ===================================================
// ⚙️ Config utilitario para URL base
// ===================================================
function getWSUrl(chatId?: string): string {
  // Ahora conectamos al MISMO origen (Next.js proxy)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // localhost:3000

  // ✅ LOGICA CRÍTICA:
  // Si hay chatId -> Sala específica (/ws?roomId=XYZ)
  // Si no hay chatId -> Lobby Global (/ws)
  return chatId 
    ? `${protocol}//${host}/ws?roomId=${chatId}`
    : `${protocol}//${host}/ws`; 
}

// ===================================================
// 🟢 Conectar al WebSocket
// ===================================================
export function connectWS(
  chatId: string | null, // ✅ Aceptamos null explícitamente
  onMessage: (msg: any) => void
): WebSocket | null {
  
  if (reconnectTimer) clearTimeout(reconnectTimer);

  // Si ya estamos conectados al MISMO chat (o al lobby), no reconectamos
  if (socket && currentChatId === chatId && socket.readyState === WebSocket.OPEN) {
      console.log('⚡ WS ya conectado, reutilizando conexión.');
      currentOnMessage = onMessage; // Actualizamos el handler por si cambió
      return socket;
  }

  // Si hay una conexión previa diferente, la cerramos
  if (socket) {
    try {
      socket.close();
    } catch {}
    socket = null;
  }
  
  currentChatId = chatId;
  currentOnMessage = onMessage;

  // Obtenemos URL (pasamos undefined si es null para que getWSUrl lo maneje)
  const wsUrl = getWSUrl(chatId || undefined);
  
  console.log(`⚙️ Intentando conectar WS → ${wsUrl}`);

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      reconnectAttempts = 0; // 🔁 Reset del backoff
      console.log('🟢 WebSocket conectado →', wsUrl);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (currentOnMessage) {
            currentOnMessage(data); // Enviamos datos al hook
        }
      } catch (err) {
        console.error('❌ Error al procesar mensaje WS:', err);
      }
    };

    socket.onclose = (event) => {
      console.warn(
        `🔴 WS desconectado (${event.code}):`,
        event.reason || 'cerrado'
      );
      socket = null;

      // 🔥 1. Seguridad: Token inválido
      if (AUTH_CLOSE_CODES.includes(event.code)) {
        console.error(`❌ WS Sesión Inválida (${event.code}). Redirigiendo...`);
        if (currentOnMessage) {
            currentOnMessage({ system: true, type: 'AUTH_FAILED' });
        }
        deleteSessionAndRedirect(); // Forzamos salida
        return; 
      }

      // 2. Reconexión automática (solo si no fue cierre limpio)
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
  
  // Si estamos en el Lobby (currentChatId === null), no deberíamos enviar mensajes de texto
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
    currentChatId = null; // Limpiamos el ID activo
    console.log('🔴 WS cerrado manualmente');
  }
}

// ===================================================
// 🧩 Utilidad de Redirección Forzada
// ===================================================
export function deleteSessionAndRedirect() {
    disconnectWS();
    
    // Al ser un archivo de utilidad (no un componente), 
    // usamos window.location para garantizar la redirección completa.
    if (typeof window !== 'undefined') {
        window.location.href = '/auth';
    }
}