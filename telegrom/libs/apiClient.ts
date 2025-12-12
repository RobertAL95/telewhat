import { getDeviceHeader } from '../utils/deviceDetector';

// Aseguramos que no haya barra al final para evitar dobles slashes
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5001';

export async function apiFetch(path: string, options: RequestInit = {}) {
  // 1. Obtener header de dispositivo (importante para tu lógica de sesión larga/corta)
  const deviceType = getDeviceHeader();

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include', // 🔥 CRÍTICO: Permite que el navegador envíe/reciba cookies HttpOnly
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Device': deviceType,
        ...(options.headers || {}),
      },
    });

    // Parseamos JSON de forma segura
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Priorizamos el mensaje de error del backend
      const msg = data.message || data.error || `Error ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error(`❌ Error en apiFetch [${url}]:`, err);
    throw err;
  }
}