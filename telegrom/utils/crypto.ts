'use client';

const PBKDF2_ITERATIONS = 100000;

export const buf2hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
export const hex2buf = (s: string) => new Uint8Array(s.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16))).buffer;

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
  return { encryptedKey: btoa(String.fromCharCode(...combined)), salt: buf2hex(salt.buffer) };
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

export async function encryptFileHybrid(file: File, recipientKeyRaw: any): Promise<Blob> {
  const pubKey = await window.crypto.subtle.importKey('jwk', typeof recipientKeyRaw === 'string' ? JSON.parse(recipientKeyRaw) : recipientKeyRaw, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
  const fileKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encFile = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, fileKey, await file.arrayBuffer());
  const encKey = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, await window.crypto.subtle.exportKey('raw', fileKey));
  return new Blob([JSON.stringify({ encryptedTextHex: buf2hex(encFile), ivHex: buf2hex(iv.buffer), encryptedAesKeyHex: buf2hex(encKey) })], { type: 'application/json' });
}

export async function decryptMessageBatch(messages: any[], privateKey: CryptoKey | null): Promise<any[]> {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  return Promise.all(messages.map(async (msg) => {
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
    } catch { syncMsg.text = syncMsg.isSelf ? "🔒 Mensaje enviado" : "🔒 Mensaje cifrado"; }
    return syncMsg;
  }));
}