// /components/Auth/AuthCard.tsx
'use client'

import { useState } from 'react'
import { Box, Button, Card, CardContent, TextField, Typography, IconButton } from '@mui/material'
import { Google, GitHub, LinkedIn } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

const AuthCard = () => {
  const [isRegister, setIsRegister] = useState(false)

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
      <AnimatePresence mode="wait" initial={false}>
        {isRegister ? (
          <motion.div
            key="register"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ minWidth: 350, p: 2, borderRadius: 4, boxShadow: 6 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom align="center">
                  Crear cuenta
                </Typography>

                <TextField fullWidth label="Nombre completo" margin="normal" />
                <TextField fullWidth label="Email" margin="normal" />
                <TextField fullWidth label="Contraseña" type="password" margin="normal" />

                <Button fullWidth variant="contained" sx={{ mt: 2 }}>
                  Registrarse
                </Button>

                <Typography align="center" sx={{ mt: 2, mb: 1 }}>
                  o registrarse con
                </Typography>

                <Box display="flex" justifyContent="center" gap={2}>
                  <IconButton color="primary"><Google /></IconButton>
                  <IconButton color="primary"><LinkedIn /></IconButton>
                  <IconButton color="primary"><GitHub /></IconButton>
                </Box>

                <Typography align="center" sx={{ mt: 2 }}>
                  ¿Ya tienes cuenta?{' '}
                  <Button onClick={() => setIsRegister(false)}>Inicia sesión</Button>
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ minWidth: 350, p: 2, borderRadius: 4, boxShadow: 6 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom align="center">
                  Iniciar sesión
                </Typography>

                <TextField fullWidth label="Email" margin="normal" />
                <TextField fullWidth label="Contraseña" type="password" margin="normal" />

                <Button fullWidth variant="contained" sx={{ mt: 2 }}>
                  Ingresar
                </Button>

                <Typography align="center" sx={{ mt: 2, mb: 1 }}>
                  o continuar con
                </Typography>

                <Box display="flex" justifyContent="center" gap={2}>
                  <IconButton color="primary"><Google /></IconButton>
                  <IconButton color="primary"><LinkedIn /></IconButton>
                  <IconButton color="primary"><GitHub /></IconButton>
                </Box>

                <Typography align="center" sx={{ mt: 2 }}>
                  ¿No tienes cuenta?{' '}
                  <Button onClick={() => setIsRegister(true)}>Regístrate</Button>
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default AuthCard

