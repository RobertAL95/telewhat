// src/libs/pushSubscription.ts
'use strict';

import { apiFetch } from './apiClient';

// Helper para convertir la clave pública VAPID del servidor a formato Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Inicializa el registro del Service Worker y sincroniza la suscripción Push con el Backend.
 */
export async function initPushNotifications(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("⚠️ Push API: Las notificaciones no están soportadas en este navegador.");
    return;
  }

  try {
    // 1. Registramos el Service Worker criptográfico
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log("✅ Push API: Service Worker registrado con éxito. Alcance:", registration.scope);

    // 2. Solicitamos permisos nativos al usuario si no han sido otorgados
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') {
      console.warn("⚠️ Push API: Permisos de notificación denegados por el usuario.");
      return;
    }

    // 3. Recuperamos la clave pública VAPID desde las variables de entorno de Next.js
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("❌ Push API: Falta la variable NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }

    // 4. Verificamos si ya existe una suscripción activa en el PushManager del navegador
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log("📡 Push API: Creando nueva suscripción contra los servidores de Push...");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });
    }

    // 5. Enviamos la suscripción completa (endpoint, keys, etc.) al backend para indexarla en MongoDB
    console.log("📡 Push API: Sincronizando suscripción con el servidor de Flym...");
    
    // 🟢 CORRECCIÓN: Ruta redirigida al módulo de Chat unificado
    await apiFetch('/chat/push-subscription', {
      method: 'POST',
      body: JSON.stringify(subscription)
    });
    
    console.log("✅ Push API: Dispositivo registrado y enlazado al multi-cast de fondo.");

  } catch (err) {
    console.error("❌ Push API: Fallo en el pipeline de registro de notificaciones:", err);
  }
}