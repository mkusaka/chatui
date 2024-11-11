import { AppConfig, LLMProvider } from './types';

export const getConfig = (): AppConfig => {
  const provider = (process.env.LLM_PROVIDER as LLMProvider) || 'mock';
  const apiKey = process.env.LLM_API_KEY || 'mock-api-key';

  // mockプロバイダーの場合はAPIキーは不要
  if (provider !== 'mock' && !apiKey) {
    throw new Error('LLM_API_KEY environment variable is required for non-mock providers');
  }

  return {
    llmProvider: provider,
    apiKey,
  };
};
