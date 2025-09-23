import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL no está definida');

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: number;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  messages: Message[];
}


// Traer lista de chats de un usuario logueado
export const fetchUserChats = async (userId: string): Promise<Chat[]> => {
  const response = await axios.get(`${API_URL}/chat/user/${userId}`, {
    withCredentials: true,
  });
  return response.data;
};

// Crear chat temporal para invitado
export const createGuestChat = async (name: string): Promise<Chat> => {
  const response = await axios.post(`${API_URL}/chat/conversation`, {
    participants: [{ name }],
  });
  return response.data;
};

// Enviar mensaje
export const sendMessageToChat = async (
  conversationId: string,
  sender: 'me' | 'them',
  text: string
) => {
  const response = await axios.post(
    `${API_URL}/chat/${conversationId}/message`,
    { sender, text },
    { withCredentials: true }
  );
  return response.data;
};
