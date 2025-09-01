// app/layout.tsx
import { ReactNode } from 'react'
import { ChatProvider } from './context/ChatContext'
import ThemeWrapper from './ThemeWrapper'

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <ChatProvider>
          <ThemeWrapper>{children}</ThemeWrapper>
        </ChatProvider>
      </body>
    </html>
  )
}
