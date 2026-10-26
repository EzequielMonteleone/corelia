import {createOpenAI} from '@ai-sdk/openai';
import {xai} from '@ai-sdk/xai';

const XAI_BASE_URL = 'https://api.x.ai/v1';

export const CHAT_MODEL =
  process.env.CHAT_MODEL?.trim() || 'grok-4-1-fast-non-reasoning';
export const EMBEDDING_MODEL = 'v1';
export const EMBEDDING_DIMENSIONS = 1536;

export function xaiConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function chatModel() {
  return xai(CHAT_MODEL);
}

export function embeddingModel() {
  const apiKey = process.env.XAI_API_KEY?.trim();
  return createOpenAI({
    baseURL: XAI_BASE_URL,
    ...(apiKey ? {apiKey} : {}),
  }).embedding(EMBEDDING_MODEL);
}
