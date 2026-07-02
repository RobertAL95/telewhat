'use client';

import { useState, useRef, useEffect } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext'; 
import { useSocket } from '@/context/SocketContext'; 
import { apiFetch } from '@/libs/apiClient'; 
import { decryptMessageBatch } from '@/utils/crypto';
import { useChatAudio } from './useChatAudio';
import { useChatFiles } from './useChatFiles';
import { useSecretChatSetup } from './useSecretChatSeteup';

export function useChatController(roomId?: string) {
  const { state, dispatch } = useGlobal();
  const { user } = useAuth(); 
  const { lastMessage, sendMessage } = useSocket(); 
  
  const activeId = roomId || state.activeChatId;
  const currentChat = state.chats.find((c: any) => c.id === activeId || c._id === activeId);
  const messages = activeId ? state.messages[activeId] || [] : [];
  
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchedRef = useRef<string | null>(null);

  const isCurrentlySecret = !!(currentChat?.isSecret || state.chats.find((c: any) => c._id === activeId)?.isSecret);

  const files = useChatFiles();
  const secretSetup = useSecretChatSetup(user, currentChat, messages, dispatch);

  // 🟢 EFECTO 1: Captura de estados en tiempo real (Typing y Sincronización de Doble Check)
  useEffect(() => {
    if (!lastMessage || !activeId) return;

    if (lastMessage.type === 'typing' && lastMessage.chatId === activeId) {
      if (lastMessage.userId !== user?.id) {
        setIsPartnerTyping(lastMessage.isTyping);
      }
    }

    if (lastMessage.type === 'message_delivered' && lastMessage.chatId === activeId) {
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { chatId: activeId, messageId: lastMessage.messageId, status: 'delivered' }
      });
    }
  }, [lastMessage, activeId, user?.id, dispatch]);

  // 🟢 EFECTO 2: Auto-delivery pasivo. Notifica al partner que hemos recibido sus mensajes en pantalla
  useEffect(() => {
    if (!activeId || messages.length === 0) return;

    messages.forEach((msg: any) => {
      if (msg.from !== user?.id && msg.status === 'sent') {
        sendMessage({
          type: 'message_delivered',
          chatId: activeId,
          messageId: msg._id,
          senderId: msg.from
        });
      }
    });
  }, [activeId, messages, user?.id, sendMessage]);

  useEffect(() => {
    if (!activeId || isFetchedRef.current === activeId) return;
    const loadChatHistory = async () => {
      try {
        isFetchedRef.current = activeId;
        const res = await apiFetch(`/chat/${activeId}/messages`);
        const rawMessages = Array.isArray(res) ? res : (res.body || res.data || []);
        const cleanMessages = await decryptMessageBatch(rawMessages, state.unlockedPrivateKey);
        dispatch({ type: 'SET_MESSAGES', payload: { chatId: activeId, messages: cleanMessages } });
      } catch (err) { 
        console.error("❌ Error cargando historial:", err); 
        isFetchedRef.current = null; 
      }
    };
    loadChatHistory();
  }, [activeId, state.unlockedPrivateKey, dispatch]);

  useEffect(() => {
    if (!activeId) return;
    sendMessage({ type: 'join_chat', chatId: activeId });
    return () => { sendMessage({ type: 'leave_chat', chatId: activeId }); isFetchedRef.current = null; };
  }, [activeId, sendMessage]);

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, []);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!activeId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendMessage({ type: 'typing', chatId: activeId, isTyping: true, userId: user?.id });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({ type: 'typing', chatId: activeId, isTyping: false, userId: user?.id });
      isTypingRef.current = false;
    }, 2000);
  };

  const handleSend = async (audioFileParam?: File) => {
    const fileToSend = audioFileParam || files.selectedFile;
    const textToSend = input.trim();
    if (!activeId || (!textToSend && !fileToSend) || isUploading) return;

    const tempId = Date.now().toString(); 
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    sendMessage({ type: 'typing', chatId: activeId, isTyping: false, userId: user?.id }); 

    let mediaData = null;

    try {
      if (fileToSend) {
        setIsUploading(true);
        let finalPayloadBlob: Blob = fileToSend;

        if (isCurrentlySecret) {
          const recipientPublicKeyRaw = (currentChat as any)?.recipientPublicKey || (currentChat as any)?.participants?.find((p: any) => p._id !== user?.id)?.publicKey;
          if (!recipientPublicKeyRaw) throw new Error("No se encontró la llave pública del destinatario.");

          const recipientPublicKey = await window.crypto.subtle.importKey(
            'jwk', typeof recipientPublicKeyRaw === 'string' ? JSON.parse(recipientPublicKeyRaw) : recipientPublicKeyRaw,
            { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']
          );

          const fileKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
          const arrayBuffer = await fileToSend.arrayBuffer();
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          const encryptedFileBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, fileKey, arrayBuffer);

          const exportedFileKey = await window.crypto.subtle.exportKey('raw', fileKey);
          const encryptedKeyBuffer = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, recipientPublicKey, exportedFileKey);

          const bufferToHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
          finalPayloadBlob = new Blob([JSON.stringify({
            encryptedTextHex: bufferToHex(encryptedFileBuffer), ivHex: bufferToHex(iv.buffer), encryptedAesKeyHex: bufferToHex(encryptedKeyBuffer) 
          })], { type: 'application/json' });
        }

        const formData = new FormData();
        formData.append('file', isCurrentlySecret ? new Blob([finalPayloadBlob], { type: 'application/octet-stream' }) : finalPayloadBlob, isCurrentlySecret ? `${Date.now()}_encrypted.json` : fileToSend.name);
        
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/media/upload`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        });
        const data = await uploadRes.json();
        if (data.error) throw new Error(data.message);
        
        mediaData = { url: data.body.url, type: fileToSend.type, public_id: data.body.public_id, isEncryptedStream: isCurrentlySecret };
        setIsUploading(false);
        files.clearFile(); 
      }

      // Los mensajes locales se inician con status: 'sent' (Un solo check)
      const localMsg = { _id: tempId, from: user?.id, text: textToSend, media: mediaData, timestamp: new Date().toISOString(), isSelf: true, status: 'sent' };
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId: activeId, msg: localMsg } });
      sendMessage({ type: 'message', chatId: activeId, text: textToSend, media: mediaData, tempId, isSecretStream: isCurrentlySecret }); 
      setInput('');
    } catch (error) {
      console.error("❌ Error crítico en el pipeline:", error);
      setIsUploading(false);
    }
  };

  const audio = useChatAudio(handleSend);

  return {
    user, activeId, currentChat, messages, input, setInput, isUploading, isPartnerTyping, cryptoModalOpen, setCryptoModalOpen, isCurrentlySecret,
    ...files, ...audio, ...secretSetup, handleInputChange, handleSend
  };
}