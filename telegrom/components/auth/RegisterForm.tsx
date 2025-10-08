'use client';

import { useState } from "react";
import { TextField, Button } from "@mui/material";
import { useAuth } from '../../context/AuthContext';
import AuthLayout from "./AuthLayout";
import { useAppPhase } from '../../context/AppPhaseContext';

export default function RegisterForm() {
  const { registerData, updateRegisterData, register, setAuthMode } = useAuth();
  const { phase, goToPhase } = useAppPhase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await register();
      setAuthMode("login");
      alert("Usuario registrado con éxito, ahora inicia sesión");

      goToPhase('auth');
    } catch (e: any) {
      setError(e.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  if (phase !== 'auth') return null;

  return (
    <AuthLayout title="Registrarse" error={error}>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleRegister();
        }}
      >
        <TextField
          label="Nombre"
          fullWidth
          sx={{ mb: 2 }}
          value={registerData.name}
          onChange={e => updateRegisterData({ name: e.target.value })}
          autoComplete="name"
        />
        <TextField
          label="Correo"
          fullWidth
          sx={{ mb: 2 }}
          value={registerData.email}
          onChange={e => updateRegisterData({ email: e.target.value })}
          autoComplete="email"
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          sx={{ mb: 3 }}
          value={registerData.password}
          onChange={e => updateRegisterData({ password: e.target.value })}
          autoComplete="new-password"
        />
        <Button
          variant="contained"
          fullWidth
          sx={{
            mb: 2,
            py: 1.5,
            fontWeight: 'bold',
            transition: '0.3s',
            ':hover': { transform: 'scale(1.03)' }
          }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrarse"}
        </Button>
        <Button
          variant="text"
          fullWidth
          type="button"
          onClick={() => setAuthMode("login")}
        >
          ¿Ya tienes cuenta? Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
