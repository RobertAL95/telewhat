import axios from 'axios';

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
}

// Obtener todos los chats de un usuario autenticado
export async function getChatsByUser(userId: string): Promise<Chat[]> {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/chat/user/${userId}`);
    return res.data;
  } catch (err: any) {
    console.error('Error obteniendo chats por usuario:', err.response?.data || err.message);
    return [];
  }
}

// Crear o recuperar conversación (POST /chat/conversation)
export async function getOrCreateConversation(participants: string[]) {
  try {
    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/chat/conversation`, { participants });
    return res.data;
  } catch (err: any) {
    console.error('Error creando/recuperando conversación:', err.response?.data || err.message);
    return null;
  }
}

// Enviar mensaje (POST /chat/:conversationId/message)
export async function sendMessage(conversationId: string, sender: string, text: string) {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/chat/${conversationId}/message`,
      { sender, text }
    );
    return res.data;
  } catch (err: any) {
    console.error('Error enviando mensaje:', err.response?.data || err.message);
    return null;
  }
}

// Obtener mensajes de una conversación (GET /chat/:conversationId/messages)
export async function getMessages(conversationId: string) {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/chat/${conversationId}/messages`);
    return res.data;
  } catch (err: any) {
    console.error('Error obteniendo mensajes:', err.response?.data || err.message);
    return [];
  }
}
