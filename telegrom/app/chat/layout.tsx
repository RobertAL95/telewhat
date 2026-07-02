'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material'; 
import { useAuth } from '@/context/AuthContext'; // 🛡️ El Guardia (Sesión)
import { useGlobal } from '@/context/GlobalContext'; // 🏭 La Maquinaria (Chats)
import ChatList from '@/components/Chat/ChatList';
import InviteModal from '@/components/InviteModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // Extraemos la sesión
  const { state, dispatch } = useGlobal(); // Extraemos los chats
  
  const router = useRouter();
  const pathname = usePathname();
  const { inviteModalOpen, sessionState } = state;

  // =========================================================
  // 1. 🛡️ Protección de Ruta (El Guardián)
  // =========================================================
  useEffect(() => {
    if (!user) {
      router.push('/Auth');
    }
  }, [user, router]);

  // =========================================================
  // 2. 🔗 Sincronización URL <-> Contexto
  // =========================================================
  useEffect(() => {
    if (!pathname) return;

    const match = pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    const chatIdFromUrl = match ? match[1] : null;

    if (chatIdFromUrl && state.activeChatId !== chatIdFromUrl) {
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatIdFromUrl });
    } 
    else if (!chatIdFromUrl && state.activeChatId) {
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
    }
  }, [pathname, state.activeChatId, dispatch]);

  // Si no hay usuario, retornamos null (mientras el useEffect te echa a /Auth)
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
  // 🎨 Renderizado de la App (Se libera de forma limpia)
  // =========================================================
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#111b21', overflow: 'hidden' }}>
      
      {/* Panel Izquierdo: Lista de Chats */}
      <Box
        sx={{
          width: { xs: '100%', md: 350 },
          borderRight: '1px solid #2a3942',
          bgcolor: '#111b21',
          display: { xs: state.activeChatId ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column'
        }}
      >
        <ChatList />
      </Box>

      {/* Panel Derecho: Ventana de Chat */}
      <Box 
        sx={{ 
          flex: 1, 
          bgcolor: '#0b141a', 
          position: 'relative',
          display: { xs: state.activeChatId ? 'block' : 'none', md: 'block' }
        }}
      >
        {children}
      </Box>

      <InviteModal 
        open={inviteModalOpen} 
        onClose={() => dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: false })} 
      />
    </Box>
  );
}