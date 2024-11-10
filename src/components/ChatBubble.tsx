import React from 'react';
import { Box, Text } from 'ink';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index';
import { Message } from '../types';

// Markdown構文を読み込む
loadLanguages(['markdown']);

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const highlightMessage = (text: string) => {
    return Prism.highlight(text, Prism.languages.markdown, 'markdown');
  };

  const roleColor = {
    system: 'gray',
    user: 'blue',
    assistant: 'yellow',
  };

  return (
    <Box borderStyle="round" padding={1} marginBottom={1}>
      <Text color={roleColor[message.role]}>
        {message.role}: {highlightMessage(message.text)}
      </Text>
    </Box>
  );
};

export default ChatBubble;
