import { LLMProvider, Message } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { MockLLMService } from './mockLLM';

export class LLMService {
  private googleAI?: GoogleGenerativeAI;
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private mockLLM?: MockLLMService;
  private provider: LLMProvider;
  private apiKey: string;

  constructor(provider: LLMProvider, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.initializeClient();
  }

  private initializeClient() {
    switch (this.provider) {
      case 'google':
        this.googleAI = new GoogleGenerativeAI(this.apiKey);
        break;
      case 'anthropic':
        this.anthropic = new Anthropic({ apiKey: this.apiKey });
        break;
      case 'openai':
        this.openai = new OpenAI({ apiKey: this.apiKey });
        break;
      case 'mock':
        this.mockLLM = new MockLLMService();
        break;
    }
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      switch (this.provider) {
        case 'google':
          return await this.sendToGoogle(messages);
        case 'anthropic':
          return await this.sendToAnthropic(messages);
        case 'openai':
          return await this.sendToOpenAI(messages);
        case 'mock':
          return await this.sendToMock(messages);
        default:
          throw new Error('Invalid provider');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private async sendToGoogle(messages: Message[]): Promise<string> {
    if (!this.googleAI) throw new Error('Google AI client not initialized');
    
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;
    return response.text();
  }

  private async sendToAnthropic(messages: Message[]): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content,
      })),
      max_tokens: 1024,
    });

    const content = response.content[0];
    return 'type' in content && content.type === 'text' ? content.text : 'Error: Unexpected response format';
  }

  private async sendToOpenAI(messages: Message[]): Promise<string> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return response.choices[0].message.content || '';
  }

  private async sendToMock(messages: Message[]): Promise<string> {
    if (!this.mockLLM) throw new Error('Mock LLM client not initialized');
    return await this.mockLLM.generateResponse(messages);
  }
}
