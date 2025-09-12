'use client'
import { useState } from 'react'
import { Box, TextField, Button, Link, Divider, Alert } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { useAuthCard } from '../../app/context/AuthCardContext'
import { registerUser, socialRegister } from '../../app/data/authData' // ruta a tu archivo authData

export default function RegisterForm() {
  const { setState } = useAuthCard()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await registerUser(formData)
      setSuccess('Usuario registrado correctamente.')
      console.log('Respuesta backend:', response)
      setState('login') // vuelve al login después del registro
    } catch (err: any) {
      setError(err?.message || 'Error al registrar usuario')
      console.error('Error registerUser:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="Usuario"
        name="username"
        variant="outlined"
        fullWidth
        value={formData.username}
        onChange={handleChange}
        required
      />
      <TextField
        label="Correo"
        name="email"
        type="email"
        variant="outlined"
        fullWidth
        value={formData.email}
        onChange={handleChange}
        required
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        variant="outlined"
        fullWidth
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
        {loading ? 'Registrando...' : 'Registrarse'}
      </Button>

      <Divider sx={{ my: 2 }}>o regístrate con</Divider>

      <Box display="flex" justifyContent="space-between" gap={2}>
        <Button variant="outlined" startIcon={<GoogleIcon />} fullWidth onClick={() => socialRegister('google')}>
          Google
        </Button>
        <Button variant="outlined" startIcon={<LinkedInIcon />} fullWidth onClick={() => socialRegister('linkedin')}>
          LinkedIn
        </Button>
        <Button variant="outlined" startIcon={<GitHubIcon />} fullWidth onClick={() => socialRegister('github')}>
          GitHub
        </Button>
      </Box>

      <Link component="button" variant="body2" onClick={() => setState('login')} sx={{ mt: 1 }}>
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </Box>
  )
}
