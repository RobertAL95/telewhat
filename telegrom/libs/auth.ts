import { apiFetch } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
}

/**
 * 🟢 Iniciar Sesión
 * El backend setea la cookie HttpOnly. El frontend solo recibe el usuario.
 */
export async function login(credentials: { email: string; password: string }) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  // Normalizamos respuesta por si el backend envuelve en 'data' o 'body'
  return res.user || res.data?.user || res;
}

/**
 * 🟢 Registrarse
 */
export async function register(userData: { name: string; email: string; password: string }) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return res.user || res.data?.user || res;
}

/**
 * 🟢 Cerrar Sesión
 * Backend mata la cookie.
 */
export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
    return true;
  } catch (error) {
    console.warn('Error al cerrar sesión (posiblemente ya cerrada):', error);
    return false;
  }
}

/**
 * 🟡 Validar Sesión (Persistencia)
 * Preguntamos: "¿Quién soy?".
 * Si el navegador envía la cookie correcta, el backend responde con el User.
 * Si no, responde error y retornamos null.
 */
export async function validateSession(): Promise<User | null> {
  try {
    const res = await apiFetch('/auth/me');
    const user = res.user || res.data?.user || res;
    
    if (user && user.id) {
      return user;
    }
    return null;
  } catch (error) {
    // Si da error 401 o de red, asumimos que no hay sesión válida
    return null;
  }
}