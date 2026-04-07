'use client';
import React, { createContext, useReducer, useContext, useMemo } from 'react';
import { saveMessageLocally } from '@/libs/localChatStore';

// --- Interfaces de Chat ---
export interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  timestamp?: number;
  avatar?: string;
  unreadCount?: number; 
  isGuestChat?: boolean; 
}

interface GlobalState {
  chats: ChatPreview[];
  activeChatId: string | null;
  messages: Record<string, any[]>;
  inviteModalOpen: boolean;
}

type Action =
  | { type: 'SET_CHATS'; payload: ChatPreview[] }
  | { type: 'ADD_CHAT'; payload: ChatPreview }
  | { type: 'SET_ACTIVE_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; msg: any } }
  | { type: 'LOAD_MESSAGES'; payload: { chatId: string; msgs: any[] } }
  | { type: 'TOGGLE_INVITE_MODAL'; payload: boolean }
  | { type: 'RESET_CHAT_STATE' }; // Útil para limpiar los chats al cerrar sesión

const initialState: GlobalState = {
  chats: [],
  activeChatId: null,
  messages: {},
  inviteModalOpen: false,
};

const GlobalContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    
    case 'ADD_CHAT': {
      const exists = state.chats.find(c => c.id === action.payload.id);
      if (exists) return state;
      return { ...state, chats: [action.payload, ...state.chats] };
    }
    
    case 'SET_ACTIVE_CHAT': {
      // Al abrir un chat, reseteamos su contador de no leídos
      const chatsCleaned = state.chats.map(c => 
          c.id === action.payload ? { ...c, unreadCount: 0 } : c
      );
      return { ...state, activeChatId: action.payload, chats: chatsCleaned };
    }

    case 'ADD_MESSAGE': {
      const { chatId, msg } = action.payload;
      const currentMsgs = state.messages[chatId] || [];
      
      // Evitar duplicados
      if (currentMsgs.some(m => m.timestamp === msg.timestamp && m.text === msg.text)) {
          return state;
      }

      const updatedMsgs = [...currentMsgs, msg];
      saveMessageLocally(chatId, msg);

      // 🔥 LÓGICA DE UNREAD COUNT INTACTA
      const updatedChats = state.chats.map(c => {
        if (c.id === chatId) {
            // Si el mensaje NO es mío y NO estoy viendo ese chat -> +1 Unread
            const shouldIncrement = !msg.isSelf && state.activeChatId !== chatId;
            
            return { 
                ...c, 
                lastMessage: msg.text, 
                timestamp: msg.timestamp,
                unreadCount: shouldIncrement ? (c.unreadCount || 0) + 1 : c.unreadCount
            };
        }
        return c;
      });
      
      updatedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return { 
          ...state, 
          messages: { ...state.messages, [chatId]: updatedMsgs },
          chats: updatedChats 
      };
    }

    case 'LOAD_MESSAGES':
      return {
        ...state,
        messages: { ...state.messages, [action.payload.chatId]: action.payload.msgs },
      };
      
    case 'TOGGLE_INVITE_MODAL':
      return { ...state, inviteModalOpen: action.payload };
      
    case 'RESET_CHAT_STATE':
      return initialState;
      
    default:
      return state;
  }
}

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Memorizamos valores para optimizar rendimiento
  const value = useMemo(() => ({ state, dispatch }), [state]);

  // Ya no hay pantalla de carga aquí, de eso se encarga el AuthProvider 🛡️
  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal debe usarse dentro de GlobalProvider');
  return context;
};