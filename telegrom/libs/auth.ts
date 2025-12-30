import { apiFetch } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
  avatar?: string;
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
 * Si no (Error 401 / "No session"), capturamos el error y retornamos null.
 */
export async function validateSession(): Promise<User | null> {
  try {
    const res = await apiFetch('/auth/me');
    
    // Soportamos estructuras { user: ... } o directo el objeto user
    const user = res.user || res.data?.user || res;
    
    // Verificamos que tenga ID para considerarlo válido
    if (user && (user.id || user._id)) {
      return user;
    }
    return null;

  } catch (error: any) {
    // 🔥 CORRECCIÓN CRÍTICA:
    // Si el error es "No session", "Invalid session" o código 401,
    // NO lanzamos excepción. Retornamos null silenciosamente.
    const isExpectedAuthError = 
        error.message === 'No session' || 
        error.message === 'Invalid session' || 
        error.status === 401;

    if (isExpectedAuthError) {
        return null; // Es un visitante, comportamiento normal.
    }

    // Si es otro error (ej: servidor caído 500), lo logueamos pero
    // devolvemos null para no romper la UI de inicio.
    console.error('⚠️ Error inesperado validando sesión:', error);
    return null;
  }
}