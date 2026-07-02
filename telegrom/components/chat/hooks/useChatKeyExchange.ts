'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/libs/apiClient';

export function useChatKeyExchange(currentChat: any, user: any) {
  const [recipientKeyRaw, setRecipientKeyRaw] = useState<any>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(false);

  useEffect(() => {
    if (!currentChat) {
      setRecipientKeyRaw(null);
      return;
    }

    // 1. Intentar extraer la llave si ya viene inyectada en el payload del chat
    const inlineKey = currentChat.recipientPublicKey || 
      currentChat.participants?.find((p: any) => p && (p._id !== user?.id && p.id !== user?.id))?.publicKey;

    if (inlineKey) {
      setRecipientKeyRaw(inlineKey);
      return;
    }

    // 2. Si el chat no la tiene (por inconsistencias de base de datos), consultarla al vuelo por API
    const targetUserId = currentChat.participants
      ?.map((p: any) => p && (typeof p === 'object' ? (p._id || p.id)?.toString() : p?.toString()))
      ?.find((id: string | null) => id && id !== user?.id?.toString());

    if (!targetUserId) return;

    const fetchTargetPublicKey = async () => {
      try {
        setIsLoadingKey(true);
        // Endpoint REST en tu backend que expone llaves públicas de forma segura
        const res = await apiFetch(`/users/${targetUserId}/public-key`);
        const data = res.body || res.data || res;
        if (data?.publicKey) {
          setRecipientKeyRaw(data.publicKey);
        }
      } catch (err) {
        console.error("❌ Error en intercambio asimétrico de llaves:", err);
      } finally {
        setIsLoadingKey(false);
      }
    };

    fetchTargetPublicKey();
  }, [currentChat, user?.id]);

  return { recipientKeyRaw, isLoadingKey };
}