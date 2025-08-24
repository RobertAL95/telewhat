// /components/ChatList/Render.tsx
'use client'

import { useChatListLogic } from './Logica'
import { ChatListUI } from './UI'

const ChatList = () => {
  const { chats, selectedChatId, selectChat } = useChatListLogic()

  return (
    <div style={{ maxHeight: '100vh', overflowY: 'auto' }}>
      <ChatListUI chats={chats} selectedChatId={selectedChatId} onSelect={selectChat} />
    </div>
  )
}

export default ChatList
