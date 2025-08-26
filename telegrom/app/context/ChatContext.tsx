// /context/ChatContext.tsx
'use client'

import { createContext, useContext, useState, ReactNode, useMemo } from 'react'

export type Message = {
  id: string
  text: string
  sender: 'me' | 'them'
  timestamp: number
}

export type Chat = {
  id: string
  name: string
  avatar: string
  messages: Message[]
}

type ChatContextType = {
  chats: Chat[]
  selectedChatId: string | null
  selectChat: (id: string) => void
  sendMessage: (chatId: string, text: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Juan',
      avatar: 'https://i.pravatar.cc/150?img=1',
      messages: [{ id: 'm1', text: 'Hola!', sender: 'them', timestamp: Date.now() }],
    },
  ])

  const [selectedChatId, setSelectedChatId] = useState<string | null>('1')

  const selectChat = (id: string) => setSelectedChatId(id)

  const sendMessage = (chatId: string, text: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                { id: Date.now().toString(), text, sender: 'me', timestamp: Date.now() },
              ],
            }
          : chat
      )
    )
  }

  const value = useMemo(
    () => ({ chats, selectedChatId, selectChat, sendMessage }),
    [chats, selectedChatId]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChatContext = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within a ChatProvider')
  return ctx
}
