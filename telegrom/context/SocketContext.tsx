'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { encryptStreamMessage, decryptStreamMessage } from '../utils/crypto';

interface SocketContextType {
  isConnected: boolean;
  sendMessage: (data: any) => void;
  lastMessage: any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { dispatch } = useGlobal(); 
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const userRef = useRef<any>(null);
  const sessionKeysMapRef = useRef<Record<string, CryptoKey>>({});

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_CHAT') {
        const targetChatId = event.data.chatId;
        console.log(`🛰️ SocketContext: Interceptado evento push del SW para redirigir al chat ${targetChatId}`);
        dispatch({ type: 'SET_ACTIVE_CHAT', payload: targetChatId });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [dispatch]);

  const getTunnelKey = async (chatId: string): Promise<CryptoKey> => {
    if (sessionKeysMapRef.current[chatId]) return sessionKeysMapRef.current[chatId];

    const rawKeyMaterial = new TextEncoder().encode(`flym_secure_stream_salt_${chatId}`);
    const baseKey = await window.crypto.subtle.importKey(
      'raw', rawKeyMaterial, { name: 'PBKDF2' }, false, ['deriveKey']
    );
    
    const derivedKey = await window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new Uint8Array(16), iterations: 1000, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );

    sessionKeysMapRef.current[chatId] = derivedKey;
    return derivedKey;
  };

  const destroyTunnelKey = useCallback((chatId: string) => {
    if (sessionKeysMapRef.current[chatId]) {
      delete sessionKeysMapRef.current[chatId];
      console.warn(`🗑️ Tubo WS: Clave de sesión del canal ${chatId} purgada exitosamente de la RAM.`);
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current || !userRef.current?.friendId) return;

    console.log('🔌 Flym Socket: Abriendo canal único global...');
    const wsUrl = `ws://localhost:5001/ws`; 
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 Flym Socket: Conectado y estabilizado');
      setIsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data && data.type === 'vault_expired') {
          console.warn(`🚨 Tubo WS: Alerta de expiración recibida para la sala secreta ${data.chatId}`);
          destroyTunnelKey(data.chatId);
          dispatch({ type: 'EXPIRE_SECRET_CHAT', payload: { chatId: data.chatId } });
          return;
        }

        if (data && data.type === 'message' && data.payload?.text) {
          const messageText = data.payload.text;

          if (messageText.includes('"encryptedTextHex"')) {
            try {
              const parsedCrypto = JSON.parse(messageText);
              
              if (parsedCrypto.encryptedAesKeyHex === "SESSION_TUNNEL_ACTIVE") {
                console.log(`🔒 Tubo WS: Descifrando flujo simétrico de entrada para canal ${data.chatId}...`);
                const tunnelKey = await getTunnelKey(data.chatId);
                const plainText = await decryptStreamMessage(
                  parsedCrypto.encryptedTextHex,
                  parsedCrypto.ivHex,
                  tunnelKey
                );
                data.payload.text = plainText;
              }
            } catch (cryptoErr) {
              console.error("❌ Tubo WS: Error en des-serialización:", cryptoErr);
              data.payload.text = "🔒 Error de sincronización de flujo en el túnel";
            }
          }
        }

        // 🟢 PREVENCIÓN DE BUCLE INFINITO (Corta renders redundantes)
        setLastMessage((prev: any) => {
          if (!prev || !data) return data;
          
          const prevMsgId = prev.payload?._id || prev.payload?.tempId;
          const nextMsgId = data.payload?._id || data.payload?.tempId;
          
          if (prevMsgId === nextMsgId && prev.type === data.type) {
            return prev;
          }
          return data;
        });
      } catch (err) {
        console.error("Error parseando mensaje WS:", err);
      }
    };

    ws.onclose = () => {
      console.log('🔌 Flym Socket: Desconectado');
      setIsConnected(false);
      socketRef.current = null;
      
      if (userRef.current) {
        console.log('🔌 Flym Socket: Reconectando tubo elástico en 3s...');
        setTimeout(connect, 3000);
      }
    };

    socketRef.current = ws;
  }, [destroyTunnelKey, dispatch]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      if (socketRef.current) {
        console.log('🔌 Flym Socket: Cierre explícito por sesión inexistente.');
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  }, [user, connect]);

  const sendMessage = useCallback(async (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const finalData = { ...data };

      if (finalData.type === 'message' && finalData.isSecretStream && finalData.text) {
        try {
          const tunnelKey = await getTunnelKey(finalData.chatId);
          const encryptedPackage = await encryptStreamMessage(finalData.text, tunnelKey);
          finalData.text = JSON.stringify(encryptedPackage);
        } catch (err) {
          console.error("❌ Wrapper WS: Error cifrando flujo saliente:", err);
        }
      }

      socketRef.current.send(JSON.stringify(finalData));
    } else {
      console.warn("Intento de enviar mensaje con socket cerrado");
    }
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, sendMessage, lastMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket debe usarse dentro de SocketProvider');
  return context;
};