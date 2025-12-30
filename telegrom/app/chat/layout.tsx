'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material'; // ✅ Agregamos CircularProgress
import { useGlobal } from '@/context/GlobalContext';
import ChatList from '@/components/Chat/ChatList';
import InviteModal from '@/components/InviteModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, inviteModalOpen } = state;

  // =========================================================
  // 1. 🛡️ Protección de Ruta (El Guardián)
  // =========================================================
  useEffect(() => {
    // Solo redirigimos SI ya terminó de cargar Y no hay usuario.
    // Esto evita el redirect falso durante el F5.
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // =========================================================
  // 2. 🔗 Sincronización URL <-> Contexto (Tu lógica intacta)
  // =========================================================
  useEffect(() => {
    if (!pathname) return;

    // Extraemos el ID de la URL si existe
    const match = pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    const chatIdFromUrl = match ? match[1] : null;

    if (chatIdFromUrl && state.activeChatId !== chatIdFromUrl) {
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatIdFromUrl });
    } 
    else if (!chatIdFromUrl && state.activeChatId) {
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
    }
  }, [pathname, state.activeChatId, dispatch]);

  // =========================================================
  // 3. ⏳ PANTALLA DE CARGA (El arreglo del F5)
  // =========================================================
  // Mientras "loading" sea true, mostramos esto y detenemos todo lo demás.
  if (loading) {
    return (
      <Box sx={{ 
          height: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          bgcolor: '#111b21' // Mismo fondo para que no parpadee
      }}>
        <CircularProgress color="success" size={50} />
      </Box>
    );
  }

  // Si terminó de cargar y no hay usuario, retornamos null
  // (mientras el useEffect de arriba hace el redirect a /auth)
  if (!user) return null;

  // =========================================================
  // 4. 🎨 Renderizado de la App (Tu diseño original)
  // =========================================================
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#111b21', overflow: 'hidden' }}>
      
      {/* Panel Izquierdo: Lista de Chats */}
      <Box
        sx={{
          width: { xs: '100%', md: 350 },
          borderRight: '1px solid #2a3942',
          bgcolor: '#111b21',
          // Tu lógica móvil intacta:
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