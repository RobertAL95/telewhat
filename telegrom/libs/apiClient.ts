import { getDeviceHeader } from '../utils/deviceDetector';

// 🔥 CORRECCIÓN 1: Usamos '/api' por defecto para pasar por el proxy hacia el puerto 4000
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const deviceType = getDeviceHeader();
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  // 🔥 CORRECCIÓN 2: Extraemos el token del navegador (Cookie o LocalStorage)
  let token = null;
  if (typeof window !== 'undefined') {
    token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
  }

  const headers: any = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Device': deviceType,
    ...(options.headers || {}),
  };

  // 🛡️ Inyectamos el token en los headers si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include', 
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || data.error || `Error ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error(`❌ Error en apiFetch [${url}]:`, err);
    throw err;
  }
}