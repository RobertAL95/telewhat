'use client';

import { useState } from "react";
import { TextField, Button } from "@mui/material";
import { useUser } from '../../context/utils/UserContext';
import AuthLayout from "./AuthLayout";
import { useAppPhase } from '../../context/AppPhaseContext';

export default function LoginForm() {
  const { login } = useUser();
  const { phase, goToPhase } = useAppPhase();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setBtnLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      if (!res.ok) throw new Error("Correo o contraseña incorrectos");

      const data = await res.json();
      const backendUser = data.body;

      await login("token_dummy_si_lo_necesitas", backendUser);

      // Transición loading → skeleton → chat
      goToPhase('loading');
      setTimeout(() => goToPhase('skeleton'), 300);
      setTimeout(() => goToPhase('chat'), 1000);

    } catch (err: any) {
      console.error("❌ Error login:", err);
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setBtnLoading(false);
    }
  };

  const updateLoginData = (fields: Partial<typeof loginData>) => {
    setLoginData(prev => ({ ...prev, ...fields }));
  };

  if (phase !== 'auth') return null;

  return (
    <AuthLayout title="Iniciar Sesión" error={error}>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <TextField
          label="Correo"
          fullWidth
          sx={{ mb: 2 }}
          value={loginData.email}
          onChange={e => updateLoginData({ email: e.target.value })}
          autoComplete="username"
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          sx={{ mb: 3 }}
          value={loginData.password}
          onChange={e => updateLoginData({ password: e.target.value })}
          autoComplete="current-password"
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
          disabled={btnLoading}
        >
          {btnLoading ? "Iniciando..." : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
