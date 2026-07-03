'use client';

const DB_NAME = 'flym_local_vault';
const STORE_NAME = 'messages_v1';
const DB_VERSION = 1;

// Inicializador privado de la base de datos IndexedDB
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Indexamos por chatId para búsquedas relacionales instantáneas
        const store = db.createObjectStore(STORE_NAME, { keyPath: '_id' });
        store.createIndex('chatId', 'chatId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 🟢 Persistencia local asíncrona sin bloquear el Event Loop
export async function saveMessageLocally(chatId: string, msg: any): Promise<void> {
  if (!msg || !msg._id) return;
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(tx.objectStoreNames[0] || STORE_NAME);
    
    // Normalizamos el payload para asegurar el índice chatId
    await store.put({ ...msg, chatId });
  } catch (err) {
    console.error("❌ localChatStore: Error al persistir mensaje:", err);
  }
}

// 🟢 Carga masiva asíncrona filtrada por índice de conversación
export async function loadMessages(chatId: string): Promise<any[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('chatId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(chatId));
      request.onsuccess = () => {
        const list = request.result || [];
        // Ordenamos cronológicamente de forma segura
        list.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`❌ localChatStore: Error leyendo canal ${chatId}:`, err);
    return [];
  }
}

// 🟢 Purga física del almacenamiento local (Invocada en borrados o expiraciones)
export async function clearChatLocally(chatId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('chatId');

    const request = index.openKeyCursor(IDBKeyRange.only(chatId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    console.warn(`🗑️ localChatStore: Historial en IndexedDB de la sala ${chatId} purgado totalmente.`);
  } catch (err) {
    console.error("❌ localChatStore: Error al ejecutar purga local:", err);
  }
}