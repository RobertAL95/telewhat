'use client'
import React from 'react'
import { IconButton, Menu, MenuItem, Avatar } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProfileMenu() {
  const { user, signOut } = useAuth()
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null)
  const router = useRouter()

  return (
    <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
        <Avatar>{user?.name?.charAt(0) ?? 'U'}</Avatar>
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { setAnchor(null); router.push('/profile') }}>Perfil</MenuItem>
        <MenuItem onClick={() => { setAnchor(null); signOut() }}>Cerrar sesión</MenuItem>
      </Menu>
    </div>
  )
}
