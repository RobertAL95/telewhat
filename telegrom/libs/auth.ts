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
/**
 * 🟢 Iniciar Sesión
 */
export async function login(credentials: { email: string; password: string }) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // 🕵️‍♂️ RADAR ACTIVADO: Vamos a ver qué hay aquí
  console.log("📥 RESPUESTA EXACTA DEL BACKEND AL LOGIN:", res);

  const token = res.token || res.data?.token || res.body?.token;
  
  if (token) {
    console.log("✅ ¡SÍ HAY TOKEN EN EL JSON! Guardando en LocalStorage:", token);
    localStorage.setItem('token', token);
  } else {
    console.warn("⚠️ NO HAY TOKEN EN EL JSON. Si el backend usa cookies HttpOnly, el LocalStorage quedará vacío.");
  }

  return res.user || res.data?.user || res.body?.user || res;
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
  } catch (error) {
    console.warn('Error al cerrar sesión:', error);
  } finally {
    // 🧹 LIMPIEZA OBLIGATORIA
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = "token=; path=/; max-age=0"; 
    }
    return true;
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
/**
 * 🟡 Validar Sesión (VERIFICACIÓN SILENCIOSA)
 * Ahora envía el token correctamente al recargar la página (F5)
 */
/**
 * 🟡 Validar Sesión (VERIFICACIÓN SILENCIOSA)
 * Forzamos el uso del proxy (/api) para blindar la conexión.
 */
export async function validateSession() {
  try {
    const url = '/api/auth/me'; 
    let token = null;

    if (typeof window !== 'undefined') {
      // 🕵️‍♂️ CAMBIO AQUÍ: Buscamos 'at' que es lo que pone tu backend
      token = localStorage.getItem('token') || 
              document.cookie.split('; ').find(row => row.startsWith('at='))?.split('=')[1];
    }

    if (!token) return null;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Enviamos el token que acabamos de encontrar
      },
    });

    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error('Error validando');

    const data = await res.json();
    return data.user || data;

  } catch (error) {
    return null;
  }
}