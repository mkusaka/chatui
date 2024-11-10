import React from 'react';
import { render } from '@testing-library/react';
import ChatHistory from './ChatHistory';
import { Message } from '../types';
import { describe, it, expect } from 'vitest';

describe('ChatHistory Component', () => {
  it('renders messages with role prefix', () => {
    const messages: Message[] = [
      { role: 'system', text: 'Welcome to LLM Chat!' },
      { role: 'user', text: 'Hello, AI!' },
      { role: 'assistant', text: 'How can I assist you?' },
    ];
    const { getByText } = render(<ChatHistory messages={messages} isFocused={false} />);

    expect(getByText('system: Welcome to LLM Chat!')).toBeTruthy();
    expect(getByText('user: Hello, AI!')).toBeTruthy();
    expect(getByText('assistant: How can I assist you?')).toBeTruthy();
  });
});
