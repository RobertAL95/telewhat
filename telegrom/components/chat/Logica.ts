'use client'

import { useState } from 'react'
import { useChatContext } from '../../app/context/ChatContext'

export function useChat() {
  const { chats, selectedChatId, sendMessage } = useChatContext()
  const chat = chats.find(c => c.id === selectedChatId)!
  const [newMessage, setNewMessage] = useState('')

  const onSend = () => {
    if (newMessage.trim() === '') return
    sendMessage(chat.id, newMessage)
    setNewMessage('')
  }

  return { chat, newMessage, setNewMessage, onSend }
}
