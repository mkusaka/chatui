import React, { useState } from 'react';
import { render, Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import ChatHistory from './components/ChatHistory';
import { Message } from './types';

const App: React.FC = () => {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'system', text: 'Welcome to LLM Chat!' }]);
  const [isFocused, setIsFocused] = useState<'input' | 'history'>('input');

  const handleInputChange = (value: string) => setInput(value);

  const handleSubmit = () => {
    if (input.trim() !== '') {
      setMessages([...messages, { role: 'user', text: input }]); // 新しいメッセージを下に追加
      setInput('');
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <ChatHistory messages={messages} isFocused={isFocused === 'history'} />
      <Box flexDirection="column" borderStyle="round" padding={1}>
        <Text color="green">Input:</Text>
        <TextInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder="Type a message..."
        />
      </Box>
    </Box>
  );
};

render(<App />);
