// app/layout.tsx
import { ReactNode } from 'react'
import { ChatProvider } from './context/ChatContext'

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  )
}

