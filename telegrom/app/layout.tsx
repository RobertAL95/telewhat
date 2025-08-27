'use client'

import { ReactNode } from 'react'
import { ChatProvider } from '../app/context/ChatContext'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const theme = createTheme({
    palette: {
      mode: 'light', // o 'dark', puedes hacer dinámico si quieres
      primary: { main: '#2196f3' },
      secondary: { main: '#21cbf3' },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatProvider>{children}</ChatProvider>
    </ThemeProvider>
  )
}
