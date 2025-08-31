'use client'

import { ChatUI } from './UI'
import { useChat } from './Logica'

export default function Chat() {
  const { chat, newMessage, setNewMessage, onSend } = useChat()
  return (
    <ChatUI
      chat={chat}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSend={onSend}
    />
  )
}
