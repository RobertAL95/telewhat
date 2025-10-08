'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

export type User = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest?: boolean;
};

export type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (token: string, backendUser: any) => void;
  loginGuest: (inviteToken: string, guestName: string) => Promise<string | null>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  generateInviteLink: (chatId?: string) => Promise<string | null>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const normalizeUser = (backendUser: any): User => ({
    id: backendUser._id || backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    avatar: backendUser.avatar,
    isGuest: backendUser.isGuest || false,
  });

  const login = (token: string, backendUser: any) => {
    const normalized = normalizeUser(backendUser);
    setUser(normalized);
  };

  const loginGuest = async (inviteToken: string, guestName: string): Promise<string | null> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, guestName }),
      });

      if (!res.ok) throw new Error('Error aceptando invitación');

      const data = await res.json();
      const convo = data.body;

      const guest: User = {
        id: convo?.participants?.find((p: string) => p !== convo.inviterId) || 'guest',
        name: guestName,
        isGuest: true,
      };

      setUser(guest);
      setError(null);

      return convo?._id || null;
    } catch (err: any) {
      console.error('❌ Error loginGuest:', err);
      setError(err.message || 'Error al aceptar invitación');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      if (!user?.isGuest) {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      }
    } catch (err) {
      console.warn('⚠️ Error logout backend', err);
    } finally {
      setUser(null);
      router.replace('/auth');
    }
  }, [router, user]);

  // Fetch usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/profile`, { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data?.body) {
          setUser(normalizeUser(data.body));
          setError(null);
        } else {
          setUser(null);
          setError('No hay usuario logueado o sesión expirada.');
        }
      } catch (err: any) {
        console.error('❌ Error fetchUser:', err);
        setUser(null);
        setError(err.message || 'Error desconocido al cargar usuario.');
      } finally {
        // retraso opcional para barra animada
        setTimeout(() => setLoading(false), 200);
      }
    };

    fetchUser();
  }, []);

  const generateInviteLink = async (chatId?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const res = await fetch(`${API_URL}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, chatId }),
      });

      const data = await res.json();
      if (res.ok && (data?.body?.link || data?.link)) {
        return data.body?.link || data.link;
      } else {
        console.error('❌ Error generando link:', data);
        return null;
      }
    } catch (err) {
      console.error('❌ Error request /invite:', err);
      return null;
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, login, loginGuest, logout, loading, error, generateInviteLink }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser debe usarse dentro de UserProvider');
  return ctx;
}
