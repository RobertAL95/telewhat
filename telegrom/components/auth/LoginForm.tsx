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
// 1. 🔥 IMPORTAMOS EL GUARDIA CORRECTO
import { useAuth } from '@/context/AuthContext'; 
import { login } from '@/libs/auth';

export default function LoginForm() {
  const router = useRouter();
  
  // 2. 🔥 USAMOS LA FUNCIÓN SETUSER DEL AUTHCONTEXT
  const { setUser } = useAuth(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login({ email, password });

      const user = (res.id || res._id) ? res : (res.user || res.data?.user);

      if (!user) {
        throw new Error(res.message || 'Credenciales inválidas');
      }

      // 3. 🔥 ACTUALIZAMOS AL GUARDIA ANTES DE VIAJAR
      setUser(user);

      console.log('✅ Login exitoso, redirigiendo...');
      
      // 4. 🔥 USAMOS REPLACE EN LUGAR DE PUSH (Mejor práctica en Logins)
      // Esto evita que el usuario pueda darle al botón "Atrás" y volver al form de login
      router.replace('/chat'); 

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