import { Dispatch, SetStateAction } from 'react';

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
  timestamp: number;
  id: string;
}

export interface AppState {
  messages: Message[];
  mode: 'normal' | 'insert' | 'command';
  currentInput: string;
  cursorPosition: number;
  selectedMessageIndex: number | null;
  clipboard: string | null;
}

export type LLMProvider = 'google' | 'anthropic' | 'openai' | 'mock';

export interface AppConfig {
  llmProvider: LLMProvider;
  apiKey: string;
}

export type KeyboardHandler = (
  input: string,
  key: any,
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>
) => void;

export type MessageSubmitHandler = (content: string) => void | Promise<void>;
