'use client';

import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { hex2buf } from '@/utils/crypto'; // 🟢 Eliminamos el helper local y usamos la utilidad global

export function useChatBubble(message: any, chatId: string) {
  const { state } = useGlobal();
  const [decryptedMediaUrl, setDecryptedMediaUrl] = useState<string | null>(null);
  const [isDecryptingMedia, setIsDecryptingMedia] = useState(false);
  
  // 🟢 Referencia mutable para garantizar la limpieza real del Blob en la memoria RAM
  const mediaUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message.media?.url) return;
    if (!message.media.isEncryptedStream) {
      setDecryptedMediaUrl(message.media.url);
      return;
    }

    const downloadAndDecryptMedia = async () => {
      try {
        setIsDecryptingMedia(true);
        const res = await fetch(message.media.url);
        const encryptedData = await res.json();

        if (!state.unlockedPrivateKey) throw new Error("Llave privada no disponible.");

        // 1. Descifrar la clave simétrica efímera (AES) usando la clave privada RSA del cliente
        const decryptedKeyRaw = await window.crypto.subtle.decrypt(
          { name: 'RSA-OAEP' },
          state.unlockedPrivateKey,
          hex2buf(encryptedData.encryptedAesKeyHex)
        );

        // 2. Importar la clave simétrica cruda recuperada
        const fileKey = await window.crypto.subtle.importKey(
          'raw', decryptedKeyRaw, { name: 'AES-GCM' }, false, ['decrypt']
        );

        // 3. Descifrar el payload binario del archivo
        const decryptedFileBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(hex2buf(encryptedData.ivHex)) },
          fileKey,
          hex2buf(encryptedData.encryptedTextHex)
        );

        // 4. Generar URL segura y guardarla en el estado y la referencia
        const blob = new Blob([decryptedFileBuffer], { type: message.media.type });
        const objectUrl = URL.createObjectURL(blob);
        
        mediaUrlRef.current = objectUrl;
        setDecryptedMediaUrl(objectUrl);
      } catch (err) {
        console.error("❌ useChatBubble: Error en pipeline híbrido:", err);
      } finally {
        setIsDecryptingMedia(false);
      }
    };

    downloadAndDecryptMedia();

    // 🟢 Limpieza de memoria atómica libre de closures obsoletos
    return () => {
      if (mediaUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrlRef.current);
        mediaUrlRef.current = null;
      }
    };
  }, [message.media, chatId, state.unlockedPrivateKey]);

  return { decryptedMediaUrl, isDecryptingMedia };
}