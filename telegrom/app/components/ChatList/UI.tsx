// /components/ChatList/UI.tsx
import { List, ListItem, ListItemAvatar, Avatar, ListItemText } from '@mui/material'
import { Chat } from '@/context/ChatContext'

type Props = {
  chats: Chat[]
  selectedChatId: string | null
  onSelect: (id: string) => void
}

export const ChatListUI = ({ chats, selectedChatId, onSelect }: Props) => {
  return (
    <List>
      <h1>Chats</h1>
      {chats.map(chat => (
        <ListItem
          key={chat.id}
          selected={chat.id === selectedChatId}
          onClick={() => onSelect(chat.id)}
          button
        >
          <ListItemAvatar>
            <Avatar src={chat.avatar} />
          </ListItemAvatar>
          <ListItemText primary={chat.name} />
        </ListItem>
      ))}
    </List>
  )
}
