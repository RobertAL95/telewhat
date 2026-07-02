'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { encryptStreamMessage, decryptStreamMessage } from '@/utils/crypto';

interface SocketContextType {
  isConnected: boolean;
  sendMessage: (data: any) => void;
  lastMessage: any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { state, dispatch } = useGlobal(); // 🟢 Inyectamos dispatch para propagar cambios de UI
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Mutable Refs para aislar el estado reactivo del ciclo de vida del WebSocket
  const userRef = useRef<any>(null);
  // Mapa en caliente dentro del Provider para indexar y reutilizar la clave fija de cada túnel
  const sessionKeysMapRef = useRef<Record<string, CryptoKey>>({});

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 🟢 INTERCEPTOR DEL SERVICE WORKER: Captura clics de notificaciones push en segundo plano
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_CHAT') {
        const targetChatId = event.data.chatId;
        console.log(`🛰️ SocketContext: Interceptado evento push del SW para redirigir al chat ${targetChatId}`);
        // Forzamos síncronamente el cambio de chat en caliente dentro del estado global
        dispatch({ type: 'SET_ACTIVE_CHAT', payload: targetChatId });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [dispatch]);

  // Generador/Derivador determinista de llaves simétricas AES por canal de sesión
  const getTunnelKey = async (chatId: string): Promise<CryptoKey> => {
    if (sessionKeysMapRef.current[chatId]) return sessionKeysMapRef.current[chatId];

    const rawKeyMaterial = new TextEncoder().encode(`flym_secure_stream_salt_${chatId}`);
    const baseKey = await window.crypto.subtle.importKey(
      'raw', rawKeyMaterial, { name: 'PBKDF2' }, false, ['deriveKey']
    );
    
    const derivedKey = await window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new Uint8Array(16), iterations: 1000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    sessionKeysMapRef.current[chatId] = derivedKey;
    return derivedKey;
  };

  // 🟢 UTILIDAD ATÓMICA: Destructor explícito de llaves de la sesión en RAM
  const destroyTunnelKey = useCallback((chatId: string) => {
    if (sessionKeysMapRef.current[chatId]) {
      delete sessionKeysMapRef.current[chatId];
      console.warn(`🗑️ Tubo WS: Clave de sesión del canal ${chatId} purgada exitosamente de la RAM.`);
    }
  }, []);

  // Función de conexión única y aislada
  const connect = useCallback(() => {
    if (socketRef.current || !userRef.current?.friendId) return;

    console.log('🔌 Flym Socket: Abriendo canal único global...');
    const wsUrl = `ws://localhost:5001/ws`; 
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 Flym Socket: Conectado y estabilizado');
      setIsConnected(true);
    };

    // =====================================================================
    // 📥 INTERCEPTOR DE ENTRADA: Calibrado para la estructura del Backend
    // =====================================================================
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🟢 INTERCEPTOR DE EVENTO: Muerte y Purga Asíncrona de Bóvedas
        if (data && data.type === 'vault_expired') {
          console.warn(`🚨 Tubo WS: Alerta de expiración recibida para la sala secreta ${data.chatId}`);
          
          // 1. Destrucción de la clave en caliente en el búfer de red
          destroyTunnelKey(data.chatId);

          // 2. Despacho directo al Reducer Global para purgar estados locales y renderizar aviso
          dispatch({ 
            type: 'EXPIRE_SECRET_CHAT', 
            payload: { chatId: data.chatId } 
          });
          return;
        }

        // 🔍 Mapeo milimétrico de mensajes ordinarios
        if (data && data.type === 'message' && data.payload?.text) {
          const messageText = data.payload.text;

          if (messageText.includes('"encryptedTextHex"')) {
            try {
              const parsedCrypto = JSON.parse(messageText);
              
              // Verificamos si el paquete pertenece a nuestro túnel simétrico activo
              if (parsedCrypto.encryptedAesKeyHex === "SESSION_TUNNEL_ACTIVE") {
                console.log(`🔒 Tubo WS: Descifrando flujo simétrico de entrada para canal ${data.chatId}...`);
                const tunnelKey = await getTunnelKey(data.chatId);
                
                const plainText = await decryptStreamMessage(
                  parsedCrypto.encryptedTextHex,
                  parsedCrypto.ivHex,
                  tunnelKey
                );

                // Purificamos el payload exactamente donde la burbuja visual irá a leerlo
                data.payload.text = plainText;
              }
            } catch (cryptoErr) {
              console.error("❌ Tubo WS: Error en des-serialización de flujo continuo:", cryptoErr);
              data.payload.text = "🔒 Error de sincronización de flujo en el túnel";
            }
          }
        }

        setLastMessage(data);
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
    return () => {};
  }, [user, connect]);

  // =====================================================================
  // 📤 WRAPPER DE SALIDA: Cifrado en caliente en el extremo del cable
  // =====================================================================
  const sendMessage = useCallback(async (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      let finalData = { ...data };

      // Si el mensaje sale por un canal secreto, lo blindamos simétricamente al vuelo
      if (finalData.type === 'message' && finalData.isSecretStream && finalData.text) {
        try {
          const tunnelKey = await getTunnelKey(finalData.chatId);
          const encryptedPackage = await encryptStreamMessage(finalData.text, tunnelKey);
          
          // Serializamos manteniendo compatibilidad estricta con el backend
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