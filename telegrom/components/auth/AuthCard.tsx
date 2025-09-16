// /components/Auth/AuthCard.tsx
'use client'

import dynamic from 'next/dynamic'
import { Box } from '@mui/material'
import { AuthProvider } from './AuthContext'

const AuthCardContent = dynamic(() => import('./AuthCardContent'), { ssr: false })

const AuthCard = () => {
  return (
    <AuthProvider>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f0f2f5',
        }}
      >
        <AuthCardContent />
      </Box>
    </AuthProvider>
  )
}

export default AuthCard
