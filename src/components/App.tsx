import React, { useState, useEffect } from 'react';
import { Box, useInput, useApp } from 'ink';
import { AppState, Message } from '../types';
import { handleNormalMode, handleInsertMode, handleCommandMode } from '../handlers/keyboardHandlers';
import { v4 as uuidv4 } from 'uuid';
import { ChatHistory } from '../components/ChatHistory';
import { InputBox } from '../components/InputBox';
import { StatusBar } from '../components/StatusBar';
import { LLMService } from '../services/llm';
import { getConfig } from '../config';

const initialState: AppState = {
  messages: [],
  mode: 'normal',
  currentInput: '',
  cursorPosition: 0,
  selectedMessageIndex: null,
  clipboard: null,
};

export const App: React.FC = () => {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>(initialState);
  const [llmService, setLLMService] = useState<LLMService | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const config = getConfig();
      setLLMService(new LLMService(config.llmProvider, config.apiKey));
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      exit();
    }
  }, []);

  const handleMessageSubmit = async (content: string) => {
    if (!llmService || isProcessing || !content.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now(),
      id: uuidv4(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      currentInput: '',
      cursorPosition: 0,
      mode: 'normal',
    }));

    setIsProcessing(true);

    try {
      const response = await llmService.sendMessage([...state.messages, newMessage]);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        id: uuidv4(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));
    } catch (error) {
      console.error('Error getting LLM response:', error);
      const errorMessage: Message = {
        role: 'system',
        content: 'Error: Failed to get response from LLM service',
        timestamp: Date.now(),
        id: uuidv4(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommand = (command: string, fullInput: string) => {
    switch (command) {
      case 'w': {
        // Insert モードで入力された内容を送信
        const messageContent = state.currentInput;
        if (messageContent.trim()) {
          handleMessageSubmit(messageContent);
        }
        break;
      }
      case 'q':
        exit();
        break;
      default:
        break;
    }
  };

  useInput((input, key) => {
    switch (state.mode) {
      case 'normal':
        handleNormalMode(input, key, state, setState);
        break;
      case 'insert':
        handleInsertMode(input, key, state, setState);
        break;
      case 'command':
        handleCommandMode(input, key, state, setState, handleCommand);
        break;
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1}>
        <ChatHistory
          messages={state.messages}
          selectedIndex={state.selectedMessageIndex}
          mode={state.mode}
        />
      </Box>
      <StatusBar mode={state.mode} />
      <InputBox
        value={state.currentInput}
        mode={state.mode}
        cursorPosition={state.cursorPosition}
        placeholder={isProcessing ? 'Processing...' : 'Press \'i\' to enter insert mode...'}
      />
    </Box>
  );
};
