export function saveMessageLocally(chatId: string, msg: any) {
  const key = `chat_${chatId}`;
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  data.push(msg);
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadMessages(chatId: string) {
  return JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
}
