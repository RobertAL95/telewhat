'use client';
import React, { createContext, useReducer, useContext, useMemo, useEffect, useCallback } from 'react';
import { saveMessageLocally } from '@/libs/localChatStore';
import { validateSession, logout as apiLogout, User } from '@/libs/auth';

// --- Interfaces ---
export interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  timestamp?: number;
  avatar?: string;
  unreadCount?: number;
}

interface GlobalState {
  user: User | null;
  chats: ChatPreview[];
  activeChatId: string | null;
  messages: Record<string, any[]>;
  inviteModalOpen: boolean;
  loading: boolean;
  error: string | null;
}

// --- Acciones ---
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CHATS'; payload: ChatPreview[] }
  | { type: 'ADD_CHAT'; payload: ChatPreview }
  | { type: 'SET_ACTIVE_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; msg: any } }
  | { type: 'LOAD_MESSAGES'; payload: { chatId: string; msgs: any[] } }
  | { type: 'TOGGLE_INVITE_MODAL'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const initialState: GlobalState = {
  user: null,
  chats: [],
  activeChatId: null,
  messages: {},
  inviteModalOpen: false,
  loading: true, // Empieza cargando para evitar flash de contenido
  error: null,
};

const GlobalContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
  logout: () => Promise<void>;
}>({ 
  state: initialState, 
  dispatch: () => {}, 
  logout: async () => {} 
});

// --- Reducer ---
function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'SET_USER':
      // Al setear usuario, automáticamente dejamos de cargar
      return { ...state, user: action.payload, loading: false, error: null };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_CHATS':
      return { ...state, chats: action.payload };

    case 'ADD_CHAT': {
      const exists = state.chats.find(c => c.id === action.payload.id);
      if (exists) return state;
      return { ...state, chats: [action.payload, ...state.chats] };
    }

    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChatId: action.payload };

    case 'ADD_MESSAGE': {
      const { chatId, msg } = action.payload;
      const currentMsgs = state.messages[chatId] || [];
      const updatedMsgs = [...currentMsgs, msg];
      saveMessageLocally(chatId, msg);

      const updatedChats = state.chats.map(c => {
        if (c.id === chatId) {
            return { 
                ...c, 
                lastMessage: msg.text, 
                timestamp: msg.timestamp 
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

    case 'LOGOUT':
      return { ...initialState, loading: false };

    default:
      return state;
  }
}

// --- Provider ---
export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Función de Logout Helper
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // 🟢 Lógica de Inicialización (Simplificada)
  const initAuth = useCallback(async () => {
    // Ya no necesitamos try/catch aquí porque validateSession nunca falla
    const user = await validateSession(); 

    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []); // Dependencias vacías
// Dependencias vacías: solo queremos definir esto una vez

  // Efecto único al montar
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const value = useMemo(() => ({ state, dispatch, logout }), [state, logout]);

  // Pantalla de carga inicial (Full Screen)
  // Se muestra mientras loading sea true Y no tengamos usuario
  if (state.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Iniciando Flym...</p>
        </div>
      </div>
    );
  }

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal debe usarse dentro de GlobalProvider');
  return context;
};