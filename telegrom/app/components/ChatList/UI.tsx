// /components/ChatList/UI.tsx
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemButton,
  Typography,
} from '@mui/material'
import { Chat } from '../../context/ChatContext'

type Props = {
  chats: Chat[]
  selectedChatId: string | null
  onSelect: (id: string) => void
}

export const ChatListUI = ({ chats, selectedChatId, onSelect }: Props) => {
  return (
    <List>
      <Typography variant="h6" sx={{ px: 2, py: 1 }}>
        Chats
      </Typography>
      {chats.map((chat) => (
        <ListItem key={chat.id} disablePadding>
          <ListItemButton
            selected={chat.id === selectedChatId}
            onClick={() => onSelect(chat.id)}
          >
            <ListItemAvatar>
              <Avatar src={chat.avatar} />
            </ListItemAvatar>
            <ListItemText primary={chat.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}
