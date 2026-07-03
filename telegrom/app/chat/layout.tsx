'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material'; 
import { useAuth } from '@/context/AuthContext'; // 🛡️ El Guardia (Sesión)
import { useGlobal } from '@/context/GlobalContext'; // 🏭 La Maquinaria (Chats)
import InviteModal from '@/components/InviteModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // Extraemos la sesión
  const { state, dispatch } = useGlobal(); // Extraemos los chats
  const router = useRouter();
  const { inviteModalOpen, sessionState } = state;

  // =========================================================
  // 1. 🛡️ Protección de Ruta (El Guardián)
  // =========================================================
  useEffect(() => {
    if (!user) {
      router.push('/Auth');
    }
  }, [user, router]);

  // Si no hay usuario, retornamos null (mientras el useEffect redirige)
  if (!user) return null;

  // =========================================================
  // 🛡️ EL ESCUDO VISUAL (SKELETON GLOBAL DE LA APLICACIÓN)
  // Reacciona de forma pura al estado dictado por el GlobalContext
  // =========================================================
  if (sessionState === 'INITIALIZING') {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100vh', 
          justifyContent: 'center', 
          alignItems: 'center', 
          bgcolor: '#0b141a',
          color: '#8696a0'
        }}
      >
        <CircularProgress sx={{ color: '#00a884', mb: 2 }} />
        <Typography sx={{ fontFamily: 'sans-serif', fontSize: '0.9rem', letterSpacing: 0.5 }}>
          Preparando Flym Web... 🔒
        </Typography>
      </Box>
    );
  }

  // =========================================================
  // 🎨 Renderizado Limpio del Layout Pass-Through
  // El control de las columnas pasa 100% a page.tsx
  // =========================================================
  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* Contenido inyectado dinámicamente por la SPA (page.tsx) */}
      {children}

      {/* Modal global del módulo */}
      <InviteModal 
        open={inviteModalOpen} 
        onClose={() => dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: false })} 
      />
    </Box>
  );
}