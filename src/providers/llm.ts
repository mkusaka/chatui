import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";

export type ProviderName = "gemini" | "openai" | "anthropic";

// デフォルトのプロバイダー設定をGeminiに
const DEFAULT_PROVIDER: ProviderName = "gemini";

// 各プロバイダーを設定
export const providers = {
  gemini: google("gemini-1.5-pro-latest"), // Geminiのデフォルトモデル
  openai: openai("gpt-4-turbo"), // OpenAIのデフォルトモデル
  anthropic: anthropic("claude-3-haiku-20240307"), // Anthropicのデフォルトモデル
};

// プロバイダー名に基づきモデルを取得
export const getModel = (provider: ProviderName = DEFAULT_PROVIDER) => {
  return providers[provider];
};
