// src/libs/cryptoUtils.ts

/**
 * Genera un par de llaves (Pública/Privada) para el usuario.
 * La pública se sube al server, la privada se queda en el navegador.
 */
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // Que se pueda exportar
    ["encrypt", "decrypt"]
  );
}

/**
 * Cifra un contenido (Texto o Blob) usando AES-GCM
 */
export async function encryptData(data: string | Blob, recipientPublicKey: CryptoKey) {
  // 1. Generar una llave AES temporal para este mensaje
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Preparar los datos
  const dataBuffer = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : await data.arrayBuffer();

  // 3. Cifrar el contenido
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vector de inicialización
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    dataBuffer
  );

  // 4. Cifrar la llave AES con la Llave Pública del receptor (Key Wrapping)
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    exportedAesKey
  );

  return {
    content: encryptedContent, // Buffer cifrado
    encryptedKey: encryptedAesKey, // Llave AES cifrada para el receptor
    iv: Array.from(iv) // Necesario para desencriptar
  };
}