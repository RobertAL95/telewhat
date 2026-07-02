'use client';

import { apiFetch } from '@/libs/apiClient';
import { useRouter } from 'next/navigation';

export function useSecretChatSetup(user: any, currentChat: any, messages: any[], dispatch: any) {
  const router = useRouter();

  const handleSetupSuccess = async () => {
    try {
      const myUserId = user?.id;
      let targetUserId = currentChat?.participants
        ?.map((p: any) => p && (typeof p === 'object' ? (p._id || p.id)?.toString() : p?.toString()))
        ?.find((id: string | null) => id && id !== myUserId?.toString()) || null;

      if (!targetUserId && messages?.length > 0) {
        const partnerMessage = messages.find((m: any) => {
          const senderId = typeof m.sender === 'object' ? (m.sender?._id || m.sender?.id) : (m.from || m.senderId || m.sender);
          return senderId && senderId.toString() !== myUserId?.toString() && senderId.toString() !== 'system';
        });
        if (partnerMessage) {
          const rawSender = partnerMessage.sender || partnerMessage.from || partnerMessage.senderId;
          targetUserId = typeof rawSender === 'object' ? (rawSender._id || rawSender.id)?.toString() : rawSender?.toString();
        }
      }

      if (!targetUserId) return alert("No se identificó al contacto objetivo.");

      const res = await apiFetch('/chat/secret', { method: 'POST', body: JSON.stringify({ targetUserId }) });
      const newSecretChat = res.body || res.data || res;
      if (!newSecretChat?._id) throw new Error("Estructura de chat inválida.");

      const secretChatPayload = {
        id: newSecretChat._id, _id: newSecretChat._id,
        name: `${currentChat?.name || 'Usuario'} (Secreto 🔒)`,
        lastMessage: '🔒 Chat secreto (24h)', avatar: currentChat?.avatar,
        isSecret: true, timestamp: Date.now()
      };

      dispatch({ type: 'ADD_CHAT', payload: secretChatPayload });
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: newSecretChat._id });
      router.push(`/chat/${newSecretChat._id}`);
    } catch (err) {
      console.error("❌ Fallo crítico abriendo canal secreto:", err);
    }
  };

  return { handleSetupSuccess };
}