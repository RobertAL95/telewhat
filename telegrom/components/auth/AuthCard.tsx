'use client'

import dynamic from 'next/dynamic'
import { Box } from '@mui/material'

// Carga dinámica del contenido pesado (con framer + card + íconos)
const AuthCardContent = dynamic(() => import('./AuthCardContent'), {
  ssr: false,
})

const AuthCard = () => {
  return (
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
  )
}

export default AuthCard
