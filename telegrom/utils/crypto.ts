'use client';

const PBKDF2_ITERATIONS = 100000;

// =====================================================================
// 🛠️ UTILIDADES DE CONVERSIÓN ATÓMICAS (Seguras contra nulos y desbordamientos)
// =====================================================================

export const buf2hex = (b: ArrayBuffer): string => 
  Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');

export const hex2buf = (s: string): ArrayBuffer => {
  const matches = s.match(/[\da-f]{2}/gi);
  if (!matches) return new ArrayBuffer(0); // Cláusula de salvaguarda en vez de aserción (!)
  return new Uint8Array(matches.map(h => parseInt(h, 16))).buffer;
};

// Conversión Base64 segura para flujos de datos binarios grandes
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// =====================================================================
// 🔒 GESTIÓN DE LLAVES ASIMÉTRICAS Y BÓVEDAS (Fase 1 y Ghost Mode)
// =====================================================================

export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['encrypt', 'decrypt']
  );
}

export async function encryptPrivateKeyWithPIN(privateKey: CryptoKey, pin: string): Promise<{ encryptedKey: string; salt: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const pinKey = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']);
  const aesKey = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    pinKey, { name: 'AES-GCM', length: 256 }, false, ['wrapKey']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await window.crypto.subtle.wrapKey('pkcs8', privateKey, aesKey, { name: 'AES-GCM', iv });
  
  const combined = new Uint8Array(iv.length + wrapped.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrapped), iv.length);
  
  return { 
    encryptedKey: arrayBufferToBase64(combined.buffer), 
    salt: buf2hex(salt.buffer) 
  };
}

export async function decryptPrivateKeyWithPIN(encryptedKeyBase64: string, pin: string, saltHex: string): Promise<CryptoKey> {
  const salt = new Uint8Array(hex2buf(saltHex));
  const combinedStr = atob(encryptedKeyBase64);
  const combined = new Uint8Array(combinedStr.length).map((_, i) => combinedStr.charCodeAt(i));
  const iv = combined.slice(0, 12);
  const pinKey = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']);
  const aesKey = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    pinKey, { name: 'AES-GCM', length: 256 }, false, ['unwrapKey']
  );
  return await window.crypto.subtle.unwrapKey('pkcs8', combined.slice(12), aesKey, { name: 'AES-GCM', iv }, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
}

// 🟢 EXPORTACIÓN REQUERIDA POR CRYPTOMODAL (Faltante en tu archivo previo)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

// 🟢 VERIFICACIÓN DE PIN REQUERIDA POR GHOSTMODE (Faltante en tu archivo previo)
export async function hashPIN(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return buf2hex(hashBuffer);
}

// =====================================================================
// 📦 PIPELINES DE CIFRADO HÍBRIDO Y SIMÉTRICO (Fase 2 y Sockets)
// =====================================================================

export async function encryptFileHybrid(file: File, recipientKeyRaw: unknown): Promise<Blob> {
  const jwk = typeof recipientKeyRaw === 'string' ? JSON.parse(recipientKeyRaw) : recipientKeyRaw;
  const pubKey = await window.crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
  const fileKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encFile = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, fileKey, await file.arrayBuffer());
  const encKey = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, await window.crypto.subtle.exportKey('raw', fileKey));
  return new Blob([JSON.stringify({ encryptedTextHex: buf2hex(encFile), ivHex: buf2hex(iv.buffer), encryptedAesKeyHex: buf2hex(encKey) })], { type: 'application/json' });
}

export async function decryptMessageBatch(messages: unknown[], privateKey: CryptoKey | null): Promise<any[]> {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  return Promise.all(messages.map(async (msg: any) => {
    const syncMsg = { ...msg };
    if (!syncMsg.text || !syncMsg.text.includes('"encryptedTextHex"')) return syncMsg;
    try {
      const parsed = JSON.parse(syncMsg.text);
      if (parsed.encryptedAesKeyHex && privateKey) {
        const decKeyRaw = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, hex2buf(parsed.encryptedAesKeyHex));
        const fileKey = await window.crypto.subtle.importKey('raw', decKeyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
        const decText = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(hex2buf(parsed.ivHex)) }, fileKey, hex2buf(parsed.encryptedTextHex));
        syncMsg.text = new TextDecoder().decode(decText);
      } else if (!privateKey) {
        syncMsg.text = "🔒 Sincronizando llaves asimétricas...";
      }
    } catch { 
      syncMsg.text = syncMsg.isSelf ? "🔒 Mensaje enviado" : "🔒 Mensaje cifrado"; 
    }
    return syncMsg;
  }));
}

// 🟢 CIFRADO REQUERIDA POR SOCKETCONTEXT (Faltante en tu archivo previo)
export async function encryptStreamMessage(text: string, aesKey: CryptoKey): Promise<{ encryptedTextHex: string; ivHex: string; encryptedAesKeyHex: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encodedText);
  return {
    encryptedTextHex: buf2hex(encrypted),
    ivHex: buf2hex(iv.buffer),
    encryptedAesKeyHex: "SESSION_TUNNEL_ACTIVE"
  };
}

// 🟢 DESCIFRADO REQUERIDA POR SOCKETCONTEXT (Faltante en tu archivo previo)
export async function decryptStreamMessage(encryptedHex: string, ivHex: string, aesKey: CryptoKey): Promise<string> {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(hex2buf(ivHex)) },
    aesKey,
    hex2buf(encryptedHex)
  );
  return new TextDecoder().decode(decrypted);
}