'use client';
import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { register } from '@/libs/auth';

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await register({ name, email, password });
      
      console.log("📡 Respuesta Registro:", res); // <--- DEBUG VITAL

      // Ahora 'res' debería ser { user: {...} } gracias al fix en libs/auth
      if (!res || !res.user) {
        // Si el backend mandó un mensaje de error, úsalo
        throw new Error(res?.message || res?.error || 'Error al registrar usuario (respuesta inválida)');
      }

      setSuccessMsg('¡Cuenta creada! Redirigiendo al login...');
      
      setTimeout(() => {
        onSuccess(); 
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error registro:', err);
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Nombre completo"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
        required
      />

      <TextField
        label="Correo electrónico"
        type="email"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
      />

      <TextField
        label="Contraseña"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        helperText="Mínimo 6 caracteres"
        required
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mt: 2 }}>{successMsg}</Alert>
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
          borderRadius: 2
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear Cuenta'}
      </Button>
    </Box>
  );
}