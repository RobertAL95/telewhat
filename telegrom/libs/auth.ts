import { apiFetch } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  friendId?: string; 
  avatar?: string;
  status?: string;
}

/**
 * 🟢 Login
 * El backend ya se encarga de inyectar las cookies 'at' y 'rt'.
 * Aquí solo nos interesa el objeto user para el estado de React.
 */
export async function login(credentials: { email: string; password: string }): Promise<User> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // El backend devuelve { user: { ... } }. Extraemos solo el usuario.
  return res.user;
}

/**
 * 🟢 Registro
 */
export async function register(userData: { name: string; email: string; password: string }): Promise<User> {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  return res.user;
}

/**
 * 🔴 Logout
 * Es una acción de backend. Las cookies HttpOnly solo las puede borrar el servidor.
 */
export async function logout(): Promise<boolean> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout error:', error);
  } finally {
    // No borramos localStorage porque ya no guardamos nada ahí.
    // El estado del AuthContext se limpiará tras el refresh o redirección.
    return true;
  }
}

/**
 * 🔍 Validar Sesión
 */
export async function validateSession(): Promise<User | null> {
  try {
    const res = await apiFetch('/auth/me', { method: 'GET' });
    return res.user || null;
  } catch (error) {
    // Si apiFetch lanza un 401, el usuario simplemente no está logueado.
    return null;
  }
}