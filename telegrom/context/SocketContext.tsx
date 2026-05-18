'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  sendMessage: (data: any) => void;
  lastMessage: any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current || !user?.friendId) return;

    // Usamos el path /ws que configuramos en el wsServer.js
    const wsUrl = `ws://localhost:5001/ws`; 
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 Flym Socket: Conectado');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error("Error parseando mensaje WS:", err);
      }
    };

    ws.onclose = () => {
      console.log('🔌 Flym Socket: Desconectado');
      setIsConnected(false);
      socketRef.current = null;
      
      // Reconectar si el usuario sigue ahí (después de 3s para no saturar)
      if (user) {
        setTimeout(connect, 3000);
      }
    };

    socketRef.current = ws;
  }, [user]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      socketRef.current?.close();
      socketRef.current = null;
    }

    return () => {
      socketRef.current?.close();
    };
  }, [user, connect]);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
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