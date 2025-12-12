'use client';
import React, { createContext, useReducer, useContext, useMemo, useEffect } from 'react';
import { saveMessageLocally } from '@/libs/localChatStore';
import { validateSession, logout as apiLogout, User } from '@/libs/auth';

// --- Definición del Estado ---
interface GlobalState {
  user: User | null;
  activeChatId: string | null;
  messages: Record<string, any[]>;
  inviteModalOpen: boolean;
  loading: boolean; // El "Semáforo"
}

// --- Acciones ---
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; msg: any } }
  | { type: 'LOAD_MESSAGES'; payload: { chatId: string; msgs: any[] } }
  | { type: 'TOGGLE_INVITE_MODAL'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: GlobalState = {
  user: null,
  activeChatId: null,
  messages: {},
  inviteModalOpen: false,
  loading: true, // 🔒 BLOQUEADO por defecto
};

// --- Contexto ---
// Extendemos el tipo para incluir funciones helper directas si se desea
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
      return { ...state, user: action.payload, loading: false };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_CHAT':
      return { ...state, activeChatId: action.payload };

    case 'ADD_MESSAGE': {
      const { chatId, msg } = action.payload;
      const currentMsgs = state.messages[chatId] || [];
      const updated = [...currentMsgs, msg];
      saveMessageLocally(chatId, msg); // Persistencia local de msgs
      return { ...state, messages: { ...state.messages, [chatId]: updated } };
    }

    case 'LOAD_MESSAGES':
      return {
        ...state,
        messages: { ...state.messages, [action.payload.chatId]: action.payload.msgs },
      };

    case 'TOGGLE_INVITE_MODAL':
      return { ...state, inviteModalOpen: action.payload };

    case 'LOGOUT':
      // Al hacer logout, limpiamos usuario y chat, pero NO ponemos loading en true
      // para que la UI redirija inmediatamente al login.
      return { ...initialState, loading: false };

    default:
      return state;
  }
}

// --- Provider ---
export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 1. Efecto de "Handshake" inicial
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // El estado inicial ya es loading: true, así que solo nos preocupamos por resolverlo
      const user = await validateSession();

      if (isMounted) {
        if (user) {
          console.log('✅ Sesión restaurada:', user.email);
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          console.log('ℹ️ Sin sesión activa');
          // Importante: Decimos explícitamente que ya no estamos cargando
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initAuth();

    return () => { isMounted = false; };
  }, []);

  // 2. Helper de Logout
  const logout = async () => {
    await apiLogout(); // Limpia cookie en backend
    dispatch({ type: 'LOGOUT' }); // Limpia estado en frontend
    // Opcional: window.location.href = '/auth'; si el router no lo maneja
  };

  const value = useMemo(() => ({ state, dispatch, logout }), [state]);

  // 3. 🚧 EL GUARDIA DE SEGURIDAD (Loading UI) 🚧
  // Si estamos cargando, la App NO existe. Solo existe el loader.
  if (state.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner Simple con Tailwind */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Iniciando Flym...</p>
        </div>
      </div>
    );
  }

  // 4. Si pasamos el guardia, renderizamos la App
  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

// --- Hook ---
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal debe usarse dentro de GlobalProvider');
  return context;
};