export interface ChatSummary {
  id: string;
  name: string;
  lastMessage?: string;
}

export interface Message {
  chatId: string;
  from: string;
  text: string;
  fromSelf?: boolean;
}
