'use client';

import React from 'react';
import ChatComponent from '../../components/chat';
import { withAuth } from '../../components/auth/withAuth';

const ChatPage: React.FC = () => {
  return <ChatComponent />;
};

export default withAuth(ChatPage);
