// utils/deviceDetector.ts

/**
 * Verifica si el entorno es de un dispositivo móvil (basado en User Agent).
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileUserAgent.test(navigator.userAgent);
};

/**
 * Verifica si la aplicación se está ejecutando en modo PWA ('standalone').
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

/**
 * Retorna el valor del header X-Client-Device que el backend espera.
 * Basado en la política: PWA/Móvil = persistente; Escritorio = efímero.
 */
export const getDeviceHeader = (): 'mobile-pwa' | 'web-desktop' => {
  if (isPWA() || isMobileDevice()) {
    return 'mobile-pwa'; // Política persistente (TTL largo)
  }
  return 'web-desktop'; // Política efímera (TTL de 30 minutos)
};