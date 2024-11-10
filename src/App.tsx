import React, { useState } from 'react';
import { render, Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import ChatHistory from "./components/ChatHistory";
import { Message } from "./types";
import { getModel, ProviderName } from "./providers/llm";
import { streamText } from "ai";

const App: React.FC = () => {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'system', text: 'Welcome to LLM Chat!' }]);
  const [isFocused, setIsFocused] = useState<'input' | 'history'>('input');
  const [provider, setProvider] = useState<ProviderName>('gemini'); // デフォルトでGemini

  const handleInputChange = (value: string) => setInput(value);

  const handleSubmit = async () => {
    if (input.trim() !== '') {
      const userMessage: Message = { role: 'user', text: input };
      setMessages([...messages, userMessage]);
      setInput('');

      // 選択されたプロバイダーでのストリーミング応答
      const model = getModel(provider);

      const stream = await streamText({
        model,
        messages: [
          { role: 'user', content: input },
        ],
        onChunk: ({ chunk }) => {
          // chunkをメッセージの一部として追加
          if (chunk.type === 'text-delta' && chunk.chunk) {
            setMessages((prevMessages) => [
              ...prevMessages.slice(0, -1),
              {
                role: 'assistant',
                text: (prevMessages[prevMessages.length - 1]?.text || '') + chunk.chunk,
              },
            ]);
          }
        },
      });
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <ChatHistory messages={messages} isFocused={isFocused === "history"} />
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
