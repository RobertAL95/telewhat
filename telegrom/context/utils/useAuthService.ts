'use client';

import { useUser } from './UserContext';
import { useAuthForm } from './AuthFormContext';

export function useAuthService() {
  const { setUser } = useUser();        // solo necesitamos setUser ahora
  const { loginData, registerData } = useAuthForm();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Login
  const login = async (data?: typeof loginData) => {
    const payload = data || loginData;

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include', // importante para recibir cookie HttpOnly
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    const result = await res.json(); // debe incluir { user }
    setUser(result.user);             // actualizar contexto inmediatamente

    return result;                    // devuelve { user } para que AuthComponent pueda usarlo
  };

  // Registro
  const register = async (data?: typeof registerData) => {
    const payload = data || registerData;

    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al registrar usuario');
    }

    const result = await res.json();
    return result; // típicamente { user } o { message }
  };

  return { login, register };
}
