import { AppConfig, LLMProvider } from './types';

export const getConfig = (): AppConfig => {
  const provider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai';
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is required');
  }

  return {
    llmProvider: provider,
    apiKey,
  };
};
