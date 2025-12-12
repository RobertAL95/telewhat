// libs/wsClient.ts
'use client';
import { useRouter } from 'next/navigation'; // Usaremos useRouter para la redirección
import { API_BASE_URL } from './apiClient'; // Para obtener la base URL

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentChatId: string | null = null;
let currentOnMessage: ((msg: any) => void) | null = null;

// Códigos de cierre de seguridad que requieren el logout forzado
const AUTH_CLOSE_CODES = [4001, 4003]; // 4001: Token Inválido / 4003: ACL Fallida

// ===================================================
// ⚙️ Config utilitario para URL base
// ===================================================
function getWSUrl(chatId: string): string {
  // Determinar el protocolo (ws: o wss:)
  const protocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'wss:'
      : 'ws:';
      
  // Usar la base URL de la API, reemplazando el protocolo http/https por ws/wss
  // El backend está configurado en /ws
  const host = API_BASE_URL.replace(/^http(s?):\/\//, '');

  return `${protocol}//${host}/ws?roomId=${chatId}`; // Usamos roomId para consistencia
}

// ===================================================
// 🟢 Conectar al WebSocket (autenticado por cookie HttpOnly)
// ===================================================
export function connectWS(
  chatId: string,
  onMessage: (msg: any) => void
): WebSocket | null {
  
  if (reconnectTimer) clearTimeout(reconnectTimer);

  if (socket) {
    try {
      socket.close();
    } catch {}
    socket = null;
  }
  
  currentChatId = chatId;
  currentOnMessage = onMessage;

  const wsUrl = getWSUrl(chatId);
  console.log(`⚙️ Intentando conectar WS → ${wsUrl}`);

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      reconnectAttempts = 0; // 🔁 reset del backoff
      console.log('🟢 WebSocket conectado →', wsUrl);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data); // Enviamos todos los datos al hook (incluidos system/error)
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

      // 🔥 1. Manejar errores de seguridad (Token Inválido o ACL Fallida)
      if (AUTH_CLOSE_CODES.includes(event.code)) {
        console.error(`❌ WS Sesión Inválida. Código ${event.code} requiere re-autenticación.`);
        // Disparar el evento de fallo para que el Hook ejecute el logout y la redirección
        onMessage({ system: true, type: 'AUTH_FAILED' });
        return; // No intentar reconexión
      }

      // 2. Intentar reconexión automática
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
// 🔁 Reconexión automática con backoff exponencial
// ===================================================
function scheduleReconnect(chatId: string, onMessage: (msg: any) => void) {
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
      console.error('❌ No hay chat ID activo para enviar el mensaje.');
      return;
  }

  const payload = JSON.stringify({ type: 'message', text }); // El backend deduce el chatId de la sesión
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
    console.log('🔴 WS cerrado manualmente');
  }
}

// ===================================================
// 🧩 Utilidad de Redirección (Usado por el Hook)
// ===================================================
export function deleteSessionAndRedirect() {
    // Aquí, en el cliente, el navegador borra las cookies al expirar, 
    // pero debemos forzar el cierre y la redirección.
    
    // 1. Cierre el WS si está abierto
    disconnectWS(); 
    
    // 2. Redirigir al login
    // Nota: El hook useChatWS debe llamar a esta función y usar el useRouter de Next.js.
    // Esta función solo existe para notificar la acción.
    if (typeof window !== 'undefined') {
        const router = require('next/navigation').useRouter(); // Requiere ser llamado desde un componente de React.
        router.push('/auth');
    }
}