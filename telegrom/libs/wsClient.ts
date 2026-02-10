'use client';

// ===================================================
// ⚙️ Configuración
// ===================================================
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentOnMessage: ((msg: any) => void) | null = null;

const AUTH_CLOSE_CODES = [4001, 4003]; 

function getWSUrl(): string {
  let wsUrl = BASE_URL.replace(/^http/, 'ws');
  if (!wsUrl.endsWith('/ws')) wsUrl += '/ws';
  return wsUrl;
}

// ===================================================
// 🟢 Conectar al WebSocket (MODO SINGLETON PURO)
// ===================================================
export function connectWS(
  _chatId: string | null, 
  onMessage: (msg: any) => void
): WebSocket | null {
  
  if (typeof window === 'undefined') return null;

  // Actualizamos el callback siempre
  currentOnMessage = onMessage;

  // 🔥 CORE FIX: Si ya hay socket, NO LO TOCAMOS.
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('⚡ WS: Usando conexión compartida existente.');
      return socket;
  }

  // Limpiamos si estaba muerto
  if (socket) {
    try { socket.close(); } catch {}
    socket = null;
  }
  
  // Obtenemos Token para la URL (Importante para Cloudinary/Auth en backend)
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
  const urlBase = getWSUrl();
  const url = token ? `${urlBase}?token=${token}` : urlBase;

  console.log(`⚙️ WS: Iniciando conexión Maestra a → ${url}`);

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      reconnectAttempts = 0; 
      console.log('🟢 WS: Conexión Maestra Establecida');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (currentOnMessage) currentOnMessage(data); 
      } catch (err) {
        console.error('❌ WS: Error parseando mensaje', err);
      }
    };

    socket.onclose = (event) => {
      console.warn(`🔴 WS: Desconectado (${event.code})`);
      socket = null;

      if (AUTH_CLOSE_CODES.includes(event.code)) {
        deleteSessionAndRedirect(); 
        return; 
      }

      // Reconexión automática
      if (event.code !== 1000 && event.code !== 1001) {
        scheduleReconnect(onMessage);
      }
    };

    return socket;
  } catch (e) {
    console.error('❌ WS: Fallo crítico', e);
    scheduleReconnect(onMessage);
    return null;
  }
}

export function getSocket() {
    return socket;
}

function scheduleReconnect(onMessage: (msg: any) => void) {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectAttempts++;
  const delay = Math.min(10000, 1000 * Math.pow(2, reconnectAttempts - 1));
  reconnectTimer = setTimeout(() => { connectWS(null, onMessage); }, delay);
}

// 👇 1. NUEVA FUNCIÓN GENÉRICA (Esta es la que faltaba)
// Permite enviar objetos complejos (con media, type, etc)
export function sendWSMessage(payload: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('⚠️ WS: No se pudo enviar mensaje (Socket cerrado o conectando)');
    return;
  }
  socket.send(JSON.stringify(payload));
}

// 👇 2. ACTUALIZAMOS sendMessage (Legacy)
// Mantenemos esta función para compatibilidad, pero internamente usa la nueva
export function sendMessage(text: string) {
  sendWSMessage({ type: 'message', text });
}

// ⚠️ Logout real
export function disconnectWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (socket) {
    try { socket.close(1000); } catch {}
    socket = null;
    currentOnMessage = null;
  }
}

export function deleteSessionAndRedirect() {
    disconnectWS();
    if (typeof window !== 'undefined') window.location.href = '/?error=session_expired';
}