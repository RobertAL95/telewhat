'use client'

import dynamic from 'next/dynamic'

const ChatRender = dynamic(() => import('../../components/chat/Render'), { ssr: false })

export default function ChatPage() {
  return <ChatRender />
}
