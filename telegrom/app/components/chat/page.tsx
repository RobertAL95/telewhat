'use client'

import dynamic from 'next/dynamic'

const ChatRender = dynamic(() => import('.'), { ssr: false })

export default function ChatPage() {
  return <ChatRender />
}
