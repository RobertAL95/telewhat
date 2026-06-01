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
  isSecret?: boolean;
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
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: any[] } }
  | { type: 'UPDATE_CHAT'; payload: { id: string; isSecret: boolean } } // 🟢 CORRECCIÓN: Agregamos la firma exacta de la acción
  | { type: 'TOGGLE_INVITE_MODAL'; payload: boolean }
  | { type: 'RESET_CHAT_STATE' }; 

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
      const chatsCleaned = state.chats.map(c => 
          c.id === action.payload ? { ...c, unreadCount: 0 } : c
      );
      return { ...state, activeChatId: action.payload, chats: chatsCleaned };
    }

    case 'ADD_MESSAGE': {
      const { chatId, msg } = action.payload;
      const currentMsgs = state.messages[chatId] || [];
      
      // 1. Evitar duplicados exactos
      if (currentMsgs.some((m: any) => m._id === msg._id)){
        return state;
      }

      let updatedMsgs;

      // 2. LÓGICA ANTI-DUPLICADOS: Evaluación del tempId
      if (msg.tempId) {
        const tempIndex = currentMsgs.findIndex((m: any) => m._id === msg.tempId);
        
        if (tempIndex !== -1) {
          updatedMsgs = [...currentMsgs];
          updatedMsgs[tempIndex] = msg;
        } else {
          updatedMsgs = [...currentMsgs, msg];
        }
      } else {
        updatedMsgs = [...currentMsgs, msg];
      }

      saveMessageLocally(chatId, msg);

      // Actualización del Sidebar (Chats)
      const updatedChats = state.chats.map(c => {
        if (c.id === chatId) {
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

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: { 
          ...state.messages, 
          [action.payload.chatId]: action.payload.messages 
        },
      };

    // 🟢 NUEVO: Manejador para actualizar dinámicamente las propiedades del chat (Bóveda Secreta)
    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(c => 
          c.id === action.payload.id ? { ...c, isSecret: action.payload.isSecret } : c
        )
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
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal debe usarse dentro de GlobalProvider');
  return context;
};