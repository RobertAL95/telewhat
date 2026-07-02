'use client';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext'; 
import { SocketProvider } from '@/context/SocketContext'; 
import { GlobalProvider } from '@/context/GlobalContext';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { initPushNotifications } from '@/libs/pushSubscription'; // 📡 Importamos el pipeline

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00a884' }, 
    background: {
      default: '#121b22',
      paper: '#202c33',
    },
    text: { primary: '#e9edef', secondary: '#8696a0' },
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
});

// =====================================================================
// 🛰️ COMPONENTE INTERCEPTOR: Inicializa Push solo si hay sesión activa
// =====================================================================
function PushNotificationInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    // Si el usuario está autenticado y su ID está estabilizado, registramos el SW
    if (user && (user.id || user.friendId)) {
      console.log("📡 RootLayout: Detectada identidad activa, sincronizando Service Worker...");
      initPushNotifications();
    }
  }, [user]);

  return null; // Componente silencioso, no altera la UI
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          
          {/* 1. El Jefe: Maneja la identidad */}
          <AuthProvider>
            
            {/* Inicializador síncrono que reacciona al AuthContext */}
            <PushNotificationInitializer />
            
            {/* 2. El Enchufe: Depende de la identidad para conectar el WS */}
            <SocketProvider>
              
              {/* 3. El Estado Global: Maneja la UI y datos del chat */}
              <GlobalProvider>
                {children}
              </GlobalProvider>
              
            </SocketProvider>
            
          </AuthProvider>
          
        </ThemeProvider>
      </body>
    </html>
  );
}