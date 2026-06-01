'use client';

const DB_NAME = 'FlymCryptoDB';
const STORE_NAME = 'keys';
const PBKDF2_ITERATIONS = 100000;

// =========================================================
// 1. UTILIDAD: Inicializar IndexedDB (La Bóveda del Cliente)
// =========================================================
async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// =========================================================
// 2. ALMACENAMIENTO LOCAL: Operaciones en la Bóveda del Navegador
// =========================================================
export async function savePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(privateKey, `privateKey_${userId}`);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`privateKey_${userId}`);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// =========================================================
// 3. MODO FANTASMA: Generar el Hash del PIN para el Buscador
// =========================================================
export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =========================================================
// 4. CRYPTO CORE: Crear el Par de Llaves (RSA-OAEP)
// =========================================================
export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // 🟢 CAMBIO VITAL: Ahora es 'true' para permitir envolverla (wrapKey) con el PIN
    ['encrypt', 'decrypt']
  );
}

// =========================================================
// 5. RESPALDO: Encriptar la Llave Privada con el PIN (Subir a MongoDB)
// =========================================================
export async function encryptPrivateKeyWithPIN(privateKey: CryptoKey, pin: string): Promise<{ encryptedKey: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  
  const pinKeyMaterial = await window.crypto.subtle.importKey(
    'raw', encoder.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    pinKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedBuffer = await window.crypto.subtle.wrapKey(
    'pkcs8', privateKey, aesKey, { name: 'AES-GCM', iv }
  );

  const combined = new Uint8Array(iv.length + wrappedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrappedBuffer), iv.length);

  const encryptedKeyBase64 = btoa(String.fromCharCode(...combined));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  return { encryptedKey: encryptedKeyBase64, salt: saltHex };
}

// =========================================================
// 6. RECUPERACIÓN: Desencriptar Llave Privada bajada de MongoDB usando el PIN
// =========================================================
export async function decryptPrivateKeyWithPIN(encryptedKeyBase64: string, pin: string, saltHex: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Reconstruimos los buffers originales desde Hex y Base64
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const combinedString = atob(encryptedKeyBase64);
  const combined = new Uint8Array(combinedString.length).map((_, i) => combinedString.charCodeAt(i));
  
  // Extraemos el IV (primeros 12 bytes) y la llave envuelta
  const iv = combined.slice(0, 12);
  const wrappedKeyBuffer = combined.slice(12);

  const pinKeyMaterial = await window.crypto.subtle.importKey(
    'raw', encoder.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    pinKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['unwrapKey']
  );

  // Desenvolvemos la llave para revivirla como objeto CryptoKey ejecutable
  return await window.crypto.subtle.unwrapKey(
    'pkcs8',
    wrappedKeyBuffer,
    aesKey,
    { name: 'AES-GCM', iv },
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

// =========================================================
// 7. EXPORTACIÓN: Preparar la Llave Pública para el Servidor
// =========================================================
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey('jwk', key);
}

// =========================================================
// 8. UTILIDAD: Conversores estables (Buffer <-> Hex)
// =========================================================
const buf2hex = (buffer: ArrayBuffer) => 
  Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');

const hex2buf = (hexString: string) => 
  new Uint8Array(hexString.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));

// =========================================================
// 9. E2EE CORE: Encriptar Mensaje (Modelo Híbrido AES + RSA)
// =========================================================
export async function encryptMessage(
  text: string, 
  recipientPublicKeyJwk: JsonWebKey
): Promise<{ encryptedTextHex: string, encryptedAesKeyHex: string, ivHex: string }> {
  
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // 1. Generar llave AES-GCM desechable para este mensaje
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  // 2. Encriptar el texto con la llave AES
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );

  // 3. Importar la llave pública RSA del destinatario
  const recipientPublicKey = await window.crypto.subtle.importKey(
    'jwk',
    recipientPublicKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  // 4. Exportar llave AES a formato raw y encriptarla con la pública RSA
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  );

  return {
    encryptedTextHex: buf2hex(encryptedBuffer),
    encryptedAesKeyHex: buf2hex(encryptedAesKeyBuffer),
    ivHex: buf2hex(iv.buffer)
  };
}

// =========================================================
// 10. E2EE CORE: Desencriptar Mensaje
// =========================================================
export async function decryptMessage(
  encryptedTextHex: string, 
  encryptedAesKeyHex: string, 
  ivHex: string, 
  myPrivateKey: CryptoKey
): Promise<string> {
  
  const encryptedText = hex2buf(encryptedTextHex);
  const encryptedAesKey = hex2buf(encryptedAesKeyHex);
  const iv = hex2buf(ivHex);

  // 1. Desencriptar la llave AES usando mi llave privada RSA
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    myPrivateKey,
    encryptedAesKey
  );

  // 2. Revivir la llave AES en memoria
  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 3. Desencriptar el texto real
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedText
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}