// /app/layout.tsx
import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'WhatsApp Clone',
  description: 'Clon simple de WhatsApp Web',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
