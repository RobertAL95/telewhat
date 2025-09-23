'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Chat, fetchUserChats, createGuestChat, sendMessageToChat } from '../data/chatData'
import { getLoggedUser } from '../data/authData'



interface ChatContextType {
  chats: Chat[]
  selectedChatId: string | null
  selectChat: (id: string) => void
  sendMessage: (chatId: string, text: string) => void
  participantName: string
  updateParticipantName: (name: string) => void
  registerParticipant: (name: string) => void
  isGuest: boolean
  isLoading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState('')
  const [isGuest, setIsGuest] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar chats al iniciar sesión
  useEffect(() => {
    const initChats = async () => {
      try {
        const user = await getLoggedUser()
        if (user) {
          const userChats = await fetchUserChats(user.id)
          setChats(userChats)
          setIsGuest(false)
        }
      } catch (e) {
        console.log('Usuario no logueado, será invitado')
      } finally {
        setIsLoading(false)
      }
    }
    initChats()
  }, [])

  const selectChat = (id: string) => setSelectedChatId(id)

  const sendMessage = async (chatId: string, text: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    const newMsg = await sendMessageToChat(chatId, isGuest ? 'them' : 'me', text)
    setChats(prev =>
      prev.map(c => (c.id === chatId ? { ...c, messages: [...c.messages, newMsg] } : c))
    )
  }

  const updateParticipantName = (name: string) => setParticipantName(name)

  const registerParticipant = async (name: string) => {
    const chat = await createGuestChat(name)
    setChats([chat])
    setSelectedChatId(chat.id)
    setParticipantName(name)
    setIsGuest(true)
  }

  return (
    <ChatContext.Provider
      value={{
        chats,
        selectedChatId,
        selectChat,
        sendMessage,
        participantName,
        updateParticipantName,
        registerParticipant,
        isGuest,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChatContext debe usarse dentro de ChatProvider')
  return context
}
