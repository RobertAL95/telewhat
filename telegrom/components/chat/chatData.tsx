import { apiFetch } from '@/libs/apiClient';
import { connectWebSocket } from '@/libs/websocket';

let socket: WebSocket | null = null;

export function connectSocket(token: string) {
  if (!token) throw new Error('Token requerido para WS');
  socket = connectWebSocket(token);
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendMessage(chatId: string, text: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'message', payload: { text } }));
}

export function subscribeToMessages(cb: (msg: any) => void) {
  if (!socket) return () => {};
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') cb(data.payload);
  };
  return () => {
    socket && socket.close();
  };
}
