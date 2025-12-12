'use client';
import { GlobalProvider } from '@/context/GlobalContext';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00a884' }, // verde WhatsApp
    background: {
      default: '#121b22',
      paper: '#202c33',
    },
    text: { primary: '#e9edef', secondary: '#8696a0' },
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <GlobalProvider>{children}</GlobalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
