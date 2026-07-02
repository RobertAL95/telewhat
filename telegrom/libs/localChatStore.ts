export function saveMessageLocally(chatId: string, msg: any) {
  const key = `chat_${chatId}`;
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  
  // Control de duplicados para evitar inflar el almacenamiento en disco
  if (data.some((m: any) => m._id === msg._id || (msg.tempId && m._id === msg.tempId))) {
    return;
  }

  data.push(msg);
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadMessages(chatId: string) {
  return JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
}

// =====================================================================
// 🗑️ DESTRUCTOR LOCAL: Purga absoluta de mensajes en el disco físico
// =====================================================================
export function clearChatLocally(chatId: string): void {
  const key = `chat_${chatId}`;
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.warn(`🗑️ localChatStore: Historial en disco de la sala ${chatId} destruido totalmente.`);
  }
}