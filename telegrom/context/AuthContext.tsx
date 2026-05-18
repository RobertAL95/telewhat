'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/libs/apiClient';
import { logout as apiLogout } from '@/libs/auth';
import { Box, CircularProgress } from '@mui/material';

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
  refreshUser: () => Promise<void>; // Exponemos para recargas manuales
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rutas que no requieren sesión activa
const PUBLIC_ROUTES = ['/Auth', '/register', '/forgot-password'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthError = useCallback((error: any) => {
    if (error.message === 'SessionExpired') {
      setUser(null);
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/Auth');
      }
    }
  }, [pathname, router]);

  const initAuth = useCallback(async () => {
    try {
      const response = await apiFetch('/auth/me'); 
      if (response?.user) {
        // El friendId es obligatorio para la lógica de Sockets y E2E
        setUser(response.user as User);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false); 
    }
  }, [handleAuthError]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout(); 
    } catch (error) {
      console.error("Logout falló:", error);
    } finally {
      // Limpieza total de RAM antes de redirigir
      setUser(null);
      setLoading(false);
      router.replace('/Auth');
    }
  }, [router]);

  const value = useMemo(() => ({ 
    user, 
    loading, 
    setUser, 
    logout, 
    refreshUser: initAuth 
  }), [user, loading, logout, initAuth]);

  // Pantalla de carga profesional con el branding de Flym
  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        bgcolor: '#111b21' // Color oscuro fondo WhatsApp/Flym
      }}>
        <CircularProgress color="success" size={50} thickness={4} />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};