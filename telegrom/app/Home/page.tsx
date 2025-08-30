'use client'

import Portada from '@/components/Portada/Render'
import { Box, useMediaQuery } from '@mui/material'

export default function ChatPage() {
  const isMobile = useMediaQuery('(max-width:600px)')

  return (
    
    <div>
        <Portada/>
    </div>
    
  )
}