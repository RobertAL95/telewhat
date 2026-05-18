import { getDeviceHeader } from '../utils/deviceDetector';

export const API_BASE_URL = '/api';

// Extendemos RequestInit para incluir una bandera interna
interface ApiFetchOptions extends RequestInit {
  _isRetry?: boolean;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<any> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Device': getDeviceHeader(),
    ...options.headers,
  };

  try {
    let res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Vital para envío de cookies at/rt
    });

    // 1. Interceptor de sesión expirada (401)
    // Excluimos la ruta de refresh para evitar un bucle infinito si el refresh también da 401
    if (res.status === 401 && !options._isRetry && !path.includes('/auth/refresh')) {
      options._isRetry = true;

      try {
        // Llamada silenciosa para renovar el Access Token
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST', // Ajusta a GET si tu backend lo requiere así
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          // El backend inyectó la nueva cookie 'at'. Reintentamos la petición original.
          res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          // Si el refresh falla (Refresh Token expirado/revocado), la sesión murió.
          throw new Error('SessionExpired');
        }
      } catch (refreshErr) {
        throw new Error('SessionExpired');
      }
    }

    // 2. Parseo seguro de la respuesta
    const data = await res.json().catch(() => ({}));

    // 3. Manejo de errores controlados
    if (!res.ok) {
      // Lanzamos un error tipado para que el frontend lo maneje, no un crash
      const error: any = new Error(data.message || `Error ${res.status}`);
      error.status = res.status;
      throw error;
    }

    return data;
  } catch (err: any) {
    // Evitamos ensuciar la consola con errores de expiración esperados
    if (err.message !== 'SessionExpired') {
      console.error(`[apiFetch] Fallo en ${path}:`, err);
    }
    throw err;
  }
}