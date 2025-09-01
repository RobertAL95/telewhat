// components/ThemeWrapper.tsx
'use client'

import { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

interface ThemeWrapperProps {
  children: ReactNode
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#2196f3' },
      secondary: { main: '#21cbf3' },
    },
  })

  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>
}
