// public/sw.js
'use strict';

// Derivador determinista de llaves simétricas idéntico al del SocketContext
async function deriveTunnelKeyInWorker(chatId) {
  const rawKeyMaterial = new TextEncoder().encode(`flym_secure_stream_salt_${chatId}`);
  
  const baseKey = await self.crypto.subtle.importKey(
    'raw', 
    rawKeyMaterial, 
    { name: 'PBKDF2' }, 
    false, 
    ['deriveKey']
  );
  
  return await self.crypto.subtle.deriveKey(
    { 
      name: 'PBKDF2', 
      salt: new Uint8Array(16), 
      iterations: 1000, 
      hash: 'SHA-256' 
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Convertidor de Hexadecimal a ArrayBuffer para Web Crypto
function hexToBuffer(hexString) {
  if (hexString.length % 2 !== 0) return new Uint8Array(0).buffer;
  const view = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < view.length; i++) {
    view[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return view.buffer;
}

// Interceptor de eventos Push del Servidor
self.addEventListener('push', function (event) {
  if (!event.data) return;

  event.waitUntil(
    (async () => {
      try {
        // El backend envía un JSON plano con el ID de la sala y el paquete criptográfico opaco
        const pushPayload = event.data.json();
        const { chatId, senderName, encryptedTextHex, ivHex, type } = pushPayload;

        let decryptedBody = "🔒 Nuevo mensaje cifrado";

        // Si viene un paquete cifrado simétrico válido del túnel activo
        if (encryptedTextHex && ivHex) {
          try {
            const tunnelKey = await deriveTunnelKeyInWorker(chatId);
            
            const encryptedBuffer = hexToBuffer(encryptedTextHex);
            const ivBuffer = hexToBuffer(ivHex);

            const decryptedBuffer = await self.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv: ivBuffer },
              tunnelKey,
              encryptedBuffer
            );

            decryptedBody = new TextDecoder().decode(decryptedBuffer);
          } catch (cryptoErr) {
            console.error("❌ SW: Error descifrando payload push en background:", cryptoErr);
            decryptedBody = "🔒 Contenido protegido (Llave no sincronizada)";
          }
        } else if (type === 'vault_expired') {
          decryptedBody = "🚨 La bóveda temporal ha expirado y los mensajes han sido purgados.";
        }

        // Desplegamos la notificación nativa en el sistema operativo
        const options = {
          body: decryptedBody,
          icon: '/assets/icon-192x192.png', // Adapta la ruta a tu icono real
          badge: '/assets/badge-72x72.png',
          tag: chatId, // Agrupa las notificaciones por sala
          renotify: true,
          data: {
            chatId: chatId
          }
        };

        return self.registration.showNotification(senderName || "Flym Secure", options);
      } catch (err) {
        console.error("❌ SW: Error crítico procesando evento push:", err);
      }
    })()
  );
});

// Manejador de clics en la notificación: redirige al chat correspondiente
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const chatId = event.notification.data?.chatId;

  if (!chatId) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Si la app ya está abierta, la enfocamos y redirigimos
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/chat') && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE_TO_CHAT', chatId });
          return client.focus();
        }
      }
      // Si está cerrada, abrimos una nueva ventana en la ruta del chat
      if (self.clients.openWindow) {
        return self.clients.openWindow(`/chat/${chatId}`);
      }
    })
  );
});