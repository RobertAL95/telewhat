'use client';
import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext';
import { login } from '@/libs/auth';

export default function LoginForm() {
  const router = useRouter();
  const { dispatch } = useGlobal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Llamada al backend (libs/auth.ts maneja cookies HttpOnly automáticamente)
      const res = await login({ email, password });

      // 2. Normalización Defensiva:
      // Verificamos si 'res' es el usuario directamente (tiene id o _id)
      // O si viene dentro de una propiedad .user
      const user = (res.id || res._id) ? res : (res.user || res.data?.user);

      if (!user) {
        throw new Error(res.message || 'Credenciales inválidas');
      }

      // 3. Guardar usuario en estado global
      // Esto actualiza la UI inmediatamente para evitar rebotes
      dispatch({ type: 'SET_USER', payload: user });

      // 4. Redirigir al chat
      console.log('✅ Login exitoso, redirigiendo...');
      router.push('/Chat'); // Asegúrate que tu ruta coincida con la carpeta (ej. /chat o /Chat)

    } catch (err: any) {
      console.error('❌ Error login:', err);
      setError(err.message || 'Error al iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Correo electrónico"
        type="email"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
        disabled={loading}
        autoFocus
      />

      <TextField
        label="Contraseña"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        disabled={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{
          mt: 3,
          py: 1.5,
          textTransform: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
          borderRadius: 2
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
      </Button>
    </Box>
  );
}