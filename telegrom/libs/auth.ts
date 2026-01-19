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

  // 🔍 CORRECCIÓN AQUÍ:
  // La respuesta exitosa suele venir en 'res.body'.
  // Si res.body existe, lo devolvemos (ahí adentro está { user: ... }).
  // Si no, devolvemos res por si acaso.
  return res.body || res;
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
import { API_BASE_URL } from './apiClient'; // Asegúrate de importar la URL base

// ... (login, register, logout se quedan igual) ...

/**
 * 🟡 Validar Sesión (VERIFICACIÓN SILENCIOSA)
 * Implementa tu lógica: Verifica cookies ANTES de decidir si es error o no.
 * NO usa apiFetch para evitar que explote la pantalla roja en caso de ser invitado.
 */
export async function validateSession() {
  try {
    // 1. Construimos la URL manualmente
    const url = `${API_BASE_URL}/auth/me`;

    // 2. Usamos fetch nativo para tener control total
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include', // 🔥 IMPORTANTE: Envía la cookie si existe
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // 3. APLICAMOS TU LÓGICA:
    // Si el servidor dice "401 Unauthorized" (No hay cookie o expiró),
    // NO es un error del sistema. Es simplemente un usuario nuevo.
    if (res.status === 401 || res.status === 403) {
      return null; // Retornamos null (Invitado) pacíficamente.
    }

    // 4. Si falla por otra cosa (ej: Servidor caído 500), ahí sí lanzamos error
    if (!res.ok) {
      throw new Error(`Error del servidor: ${res.status}`);
    }

    // 5. Si todo sale bien (Status 200), hay usuario
    const data = await res.json();
    // Ajustamos por si tu backend devuelve { user: ... } o directo el user
    return data.user || data;

  } catch (error) {
    // Si ni siquiera hay conexión (internet caído), retornamos null para no bloquear la app
    console.warn('⚠️ Verificación de sesión fallida (Modo Invitado activo):', error);
    return null;
  }
}