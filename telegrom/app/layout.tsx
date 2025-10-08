'use client';

import { ReactNode } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { GlobalProvider } from '../context/GlobalProvider'; // <- tu nuevo proveedor global

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0088cc' },
    background: { default: '#f5f8fa' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalProvider>
            {children}
          </GlobalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
