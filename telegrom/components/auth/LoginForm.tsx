'use client'

import { useState } from 'react'
import { Box, TextField, Button, Link, Alert } from '@mui/material'
import { useAuth } from './AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const { setIsRegister } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Simulación de login
      console.log('Login attempt', formData)
      // Aquí puedes usar tu función de login real con axios
      // const response = await loginUser(formData)
      router.push('/') // redirige al home al login exitoso
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
      {error && <Alert severity="error">{error}</Alert>}

      <TextField label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} required />
      <TextField label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} required />

      <Button variant="contained" color="primary" type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>

      <Link component="button" variant="body2" onClick={() => setIsRegister(true)}>
        ¿No tienes cuenta? Regístrate aquí
      </Link>
    </Box>
  )
}
