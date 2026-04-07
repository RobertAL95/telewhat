'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { validateSession, logout as apiLogout } from '@/libs/auth';
import { Box, CircularProgress } from '@mui/material';

// --- Interfaces de Autenticación ---
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  friendId?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}

// Inicializamos el contexto
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Verificación de sesión ultrarrápida
  const initAuth = useCallback(async () => {
    try {
      const userSession = await validateSession();
      if (userSession) {
        setUser(userSession as User);
      }
    } catch (error) {
      console.error("Auth init error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Se ejecuta una sola vez al montar la app
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 2. Función de Logout centralizada
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  // Memorizamos valores para evitar re-renderizados innecesarios
  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading, logout]);

  // 3. Pantalla de carga aislada (Solo bloquea mientras busca el token)
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#111b21' }}>
        <CircularProgress color="success" size={50} />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};