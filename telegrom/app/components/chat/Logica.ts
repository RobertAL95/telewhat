// /components/Chat/Logica.ts
import { useChatContext } from '../../context/ChatContext'

export const useChatLogic = () => {
  const { chats, selectedChatId, sendMessage } = useChatContext()

  const currentChat = chats.find(c => c.id === selectedChatId) || null

  return {
    currentChat,
    sendMessage: (text: string) => {
      if (currentChat) sendMessage(currentChat.id, text)
    },
  }
}
