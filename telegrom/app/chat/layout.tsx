'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { useGlobal } from '@/context/GlobalContext'; // ✅ Usamos el hook
import ChatList from '@/components/Chat/ChatList';
import InviteModal from '@/components/InviteModal'; // ✅ El modal vive aquí ahora

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  const { user, loading, inviteModalOpen } = state;

  // 1. Lógica de Protección (Reemplaza a AuthGuard)
  // Si terminó de cargar y no hay usuario, fuera.
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // Si no hay usuario (incluso si está cargando el Provider lo bloquea, 
  // pero esto evita parpadeos si algo fallara), no renderizamos nada del layout.
  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#111b21', overflow: 'hidden' }}>
      
      {/* Panel Izquierdo: Lista de Chats */}
      <Box
        sx={{
          width: { xs: '100%', md: 350 },
          borderRight: '1px solid #2a3942',
          bgcolor: '#111b21',
          // Ocultamos el panel en móvil si hay un chat activo (children tiene contenido)
          // Nota: Esta lógica se puede mejorar con 'activeChatId' del contexto más adelante
          display: { xs: state.activeChatId ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column'
        }}
      >
        <ChatList />
      </Box>

      {/* Panel Derecho: Ventana de Chat o Index */}
      <Box 
        sx={{ 
          flex: 1, 
          bgcolor: '#0b141a', 
          position: 'relative',
          // En móvil, si no hay chat activo, ocultamos el panel derecho
          display: { xs: state.activeChatId ? 'block' : 'none', md: 'block' }
        }}
      >
        {children}
      </Box>

      {/* ✅ MODAL GLOBAL: Conectado al contexto */}
      <InviteModal 
        open={inviteModalOpen} 
        onClose={() => dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: false })} 
      />
    </Box>
  );
}