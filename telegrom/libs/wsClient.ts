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
  _chatId: string | null, // Ya no usamos chatId para la URL, solo para lógica interna si fuera necesario
  onMessage: (msg: any) => void
): WebSocket | null {
  
  if (typeof window === 'undefined') return null;

  // Actualizamos el callback siempre, para que el componente activo reciba la data
  currentOnMessage = onMessage;

  // 🔥 CORE FIX: Si ya hay socket, NO LO TOCAMOS. Lo devolvemos y punto.
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('⚡ WS: Usando conexión compartida existente.');
      return socket;
  }

  // Solo limpiamos si el socket estaba muerto o null
  if (socket) {
    try { socket.close(); } catch {}
    socket = null;
  }
  
  // Conectamos a la raíz /ws sin query params de sala (el join lo hacemos por mensaje)
  const url = getWSUrl();
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

      // Reconexión automática agresiva
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

export function sendMessage(text: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'message', text }));
}

// ⚠️ Esta función SOLO se debe llamar en Logout real
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