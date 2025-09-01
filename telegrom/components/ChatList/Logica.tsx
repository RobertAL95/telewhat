// /components/ChatList/Logica.ts
import { useChatContext } from '../../app/context/ChatContext'

export const useChatListLogic = () => {
  const { chats, selectedChatId, selectChat } = useChatContext()

  return {
    chats,
    selectedChatId,
    selectChat,
  }
}
