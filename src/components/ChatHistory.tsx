// src/components/ChatHistory.tsx
import React from 'react';
import { Box, Text } from 'ink';
import ChatBubble from './ChatBubble';
import { Message } from '../types';

interface ChatHistoryProps {
  messages: Message[];
  isFocused: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isFocused }) => {
  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      {messages.map((msg, index) => (
        <ChatBubble key={index} message={msg} />
      ))}
      {isFocused && <Text color="green">(Chat History Focused)</Text>}
    </Box>
  );
};

export default ChatHistory;
