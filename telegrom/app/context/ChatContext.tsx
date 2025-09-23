'use client'

import { createContext, useContext, useState, ReactNode, useMemo } from 'react'

export type Message = {
  id: string
  text: string
  sender: string
  timestamp: number
}

export type Chat = {
  id: string
  name: string
  avatar: string
  messages: Message[]
}

export type ChatUser = {
  id: string
  name: string
}

type ChatContextType = {
  chats: Chat[]
  users: ChatUser[]
  selectedChatId: string | null
  selectChat: (id: string) => void
  sendMessage: (chatId: string, text: string) => void
  participantName: string | null
  isRegistered: boolean
  registerParticipant: (name: string) => void
  updateParticipantName: (name: string) => void
  creator: boolean
  roomId: string
  setCreator: (value: boolean) => void
  setRoomId: (id: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState<string | null>(null)
  const [creator, setCreator] = useState<boolean>(false)
  const [roomId, setRoomId] = useState<string>('')

  const selectChat = (id: string) => setSelectedChatId(id)

  const sendMessage = (chatId: string, text: string) => {
    if (!participantName) return
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now().toString(),
                  text,
                  sender: participantName,
                  timestamp: Date.now(),
                },
              ],
            }
          : chat
      )
    )
  }

  const registerParticipant = (name: string) => {
    if (!users.find(u => u.name === name)) {
      setUsers(prev => [...prev, { id: Date.now().toString(), name }])
    }
    setParticipantName(name)
  }

  const updateParticipantName = (name: string) => {
    setParticipantName(name)
  }

  const value = useMemo(
    () => ({
      chats,
      users,
      selectedChatId,
      selectChat,
      sendMessage,
      participantName,
      isRegistered: !!participantName,
      registerParticipant,
      updateParticipantName,
      creator,
      roomId,
      setCreator,
      setRoomId,
    }),
    [chats, users, selectedChatId, participantName, creator, roomId]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChatContext = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within a ChatProvider')
  return ctx
}
