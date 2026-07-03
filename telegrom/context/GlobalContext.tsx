'use client';
import React, { createContext, useReducer, useContext, useMemo, useEffect, useRef } from 'react';
import { saveMessageLocally, clearChatLocally } from '@/libs/localChatStore';
import { apiFetch } from '@/libs/apiClient';

// --- Interfaces de Chat ---
export interface ChatPreview {
  id: string;
  _id?: string; 
  name: string;
  lastMessage: string;
  timestamp?: number;
  avatar?: string;
  unreadCount?: number; 
  isGuestChat?: boolean; 
  isSecret?: boolean;
}

export type SessionState = 'INITIALIZING' | 'READY' | 'ERROR';

interface GlobalState {
  chats: ChatPreview[];
  activeChatId: string | null;
  messages: Record<string, any[]>;
  inviteModalOpen: boolean;
  unlockedPrivateKey: CryptoKey | null;
  sessionState: SessionState; 
}

type Action =
  | { type: 'SET_CHATS'; payload: ChatPreview[] }
  | { type: 'ADD_CHAT'; payload: ChatPreview }
  | { type: 'SET_ACTIVE_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; msg: any } }
  | { type: 'LOAD_MESSAGES'; payload: { chatId: string; msgs: any[] } }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: any[] } }
  | { type: 'UPDATE_CHAT'; payload: { id: string; isSecret: boolean } }
  | { type: 'TOGGLE_INVITE_MODAL'; payload: boolean }
  | { type: 'RESET_CHAT_STATE' }
  | { type: 'SET_PRIVATE_KEY'; payload: CryptoKey | null }
  | { type: 'SET_SESSION_STATE'; payload: SessionState }
  | { type: 'EXPIRE_SECRET_CHAT'; payload: { chatId: string } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { chatId: string; messageId: string; status: 'sent' | 'delivered' | 'read' } };

const initialState: GlobalState = {
  chats: [],
  activeChatId: null,
  messages: {},
  inviteModalOpen: false,
  unlockedPrivateKey: null,
  sessionState: 'INITIALIZING', 
};

const GlobalContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

// Helper privado para sanitizar el polimorfismo de lastMessage en el Frontend
function parseLastMessageText(lastMessageField: any): string {
  if (!lastMessageField) return "Sin mensajes";
  if (typeof lastMessageField === 'object') {
    if (lastMessageField.text && lastMessageField.text.trim().length > 0) {
      return lastMessageField.text;
    }
    return "Sin mensajes";
  }
  if (typeof lastMessageField === 'string') {
    return lastMessageField;
  }
  return "Sin mensajes";
}

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    
    case 'ADD_CHAT': {
      const exists = state.chats.find(
        c => c.id === action.payload.id || (c._id && c._id === action.payload._id)
      );
      if (exists) return state;
      return { ...state, chats: [action.payload, ...state.chats] };
    }
    
    case 'SET_ACTIVE_CHAT': {
      const chatsCleaned = state.chats.map(c => 
          (c.id === action.payload || c._id === action.payload) ? { ...c, unreadCount: 0 } : c
      );
      return { ...state, activeChatId: action.payload, chats: chatsCleaned };
    }

    case 'ADD_MESSAGE': {
      const { chatId, msg } = action.payload;
      const currentMsgs = state.messages[chatId] || [];
      
      if (currentMsgs.some((m: any) => m._id === msg._id)){
        return state;
      }

      let updatedMsgs;

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

      const updatedChats = state.chats.map(c => {
        if (c.id === chatId || c._id === chatId) {
            const shouldIncrement = !msg.isSelf && state.activeChatId !== chatId;
            
            // 🟢 CORTOCIRCUITO DEFENSIVO EN CALIENTE: Sanitizamos el payload que viene del socket/UI
            let previewText = "Sin mensajes";
            if (c.isSecret) {
              previewText = "🔒 Chat secreto (24h)";
            } else if (msg) {
              if (typeof msg.text === 'object' && msg.text !== null) {
                previewText = msg.text.text || "Sin mensajes";
              } else if (typeof msg.text === 'string') {
                previewText = msg.text;
              } else if (msg.media && msg.media.url) {
                previewText = "📷 Multimedia";
              }
            }
            
            return { 
                ...c, 
                lastMessage: previewText, 
                timestamp: msg.timestamp || Date.now(),
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

    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(c => 
          (c.id === action.payload.id || c._id === action.payload.id) 
            ? { ...c, isSecret: action.payload.isSecret } 
            : c
        )
      };
      
    case 'TOGGLE_INVITE_MODAL':
      return { ...state, inviteModalOpen: action.payload };
      
    case 'RESET_CHAT_STATE':
      return initialState;

    case 'SET_PRIVATE_KEY':
      return {
        ...state,
        unlockedPrivateKey: action.payload
      };

    case 'SET_SESSION_STATE': 
      return {
        ...state,
        sessionState: action.payload
      };

    case 'UPDATE_MESSAGE_STATUS': {
      const { chatId, messageId, status } = action.payload;
      const currentMsgs = state.messages[chatId] || [];
      const updatedMsgs = currentMsgs.map((m: any) => 
        (m._id === messageId || m.tempId === messageId) ? { ...m, status } : m
      );
      return {
        ...state,
        messages: { ...state.messages, [chatId]: updatedMsgs }
      };
    }

    case 'EXPIRE_SECRET_CHAT': {
      const { chatId } = action.payload;
      clearChatLocally(chatId);

      const systemNotice = {
        _id: `system_${Date.now()}`,
        from: 'system',
        text: '🔒 La bóveda temporal ha expirado de forma segura. Las llaves criptográficas y los mensajes han sido destruidos de este dispositivo.',
        timestamp: new Date().toISOString()
      };

      const updatedChats = state.chats.map(c => {
        if (c.id === chatId || c._id === chatId) {
          return { ...c, isSecret: false, lastMessage: '🔒 Bóveda destruida (Expired)' };
        }
        return c;
      });

      return {
        ...state,
        chats: updatedChats,
        messages: { ...state.messages, [chatId]: [systemNotice] }
      };
    }
      
    default:
      return state;
  }
}

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (state.sessionState !== 'INITIALIZING' || hasInitialized.current) return;
    hasInitialized.current = true;

    const runFullAppOrchestrator = async () => {
      try {
        let activePrivateKey: CryptoKey | null = null;
        const storedJwk = sessionStorage.getItem('flym_dev_bypass_key');

        if (storedJwk) {
          const jwk = JSON.parse(storedJwk);
          activePrivateKey = await window.crypto.subtle.importKey(
            'jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']
          );
          dispatch({ type: 'SET_PRIVATE_KEY', payload: activePrivateKey });
        }

        const chatListRes = await apiFetch('/chat/user/me');
        const rawChats = Array.isArray(chatListRes) ? chatListRes : (chatListRes?.body || chatListRes?.data || []);
        
        if (rawChats.length > 0) {
          // 🟢 FILTRO DE ARRANQUE: Extrae el texto plano antes de inyectarlo en el array de la UI
          const sanitizedChats = rawChats.map((chat: any) => ({
            ...chat,
            id: chat._id || chat.id,
            lastMessage: parseLastMessageText(chat.lastMessage),
            timestamp: chat.lastMessage?.createdAt || chat.updatedAt || Date.now()
          }));

          dispatch({ type: 'SET_CHATS', payload: sanitizedChats });
        }
        dispatch({ type: 'SET_SESSION_STATE', payload: 'READY' });
      } catch (err) {
        console.error("❌ GlobalProvider: Fallo crítico:", err);
        dispatch({ type: 'SET_SESSION_STATE', payload: 'ERROR' });
      }
    };

    runFullAppOrchestrator();
  }, [state.sessionState]); 

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal debe usarse dentro de GlobalProvider');
  return context;
};