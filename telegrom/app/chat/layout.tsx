'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box } from '@mui/material'; 
import { useAuth } from '@/context/AuthContext'; // 🛡️ El Guardia (Sesión)
import { useGlobal } from '@/context/GlobalContext'; // 🏭 La Maquinaria (Chats)
import ChatList from '@/components/Chat/ChatList';
import InviteModal from '@/components/InviteModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // Extraemos la sesión
  const { state, dispatch } = useGlobal(); // Extraemos los chats
  
  const router = useRouter();
  const pathname = usePathname();
  const { inviteModalOpen } = state;

  // =========================================================
  // 1. 🛡️ Protección de Ruta (El Guardián)
  // =========================================================
  useEffect(() => {
    // Si el guardia dice que no hay usuario, te echa inmediatamente
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
  // 3. 🎨 Renderizado de la App 
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