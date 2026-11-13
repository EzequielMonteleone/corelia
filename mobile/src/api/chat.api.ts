import {apiClient} from '@/api/client';
import {errorCode} from '@/lib/apiError';
import type {
  ChatMessage,
  ChatThread,
  PendingClaimDraft,
  PendingDraft,
} from '@/types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THREAD_STORAGE_KEY = 'corelia-chat-thread';

export async function getStoredThreadId(): Promise<string | null> {
  return AsyncStorage.getItem(THREAD_STORAGE_KEY);
}

export async function storeThreadId(threadId: string): Promise<void> {
  await AsyncStorage.setItem(THREAD_STORAGE_KEY, threadId);
}

export async function clearStoredThreadId(): Promise<void> {
  await AsyncStorage.removeItem(THREAD_STORAGE_KEY);
}

export function emptyThread(): ChatThread {
  return {
    threadId: null,
    messages: [],
    pendingDrafts: [],
    pendingClaimDrafts: [],
  };
}

export async function getThread(threadId: string): Promise<ChatThread> {
  const {data} = await apiClient.get<{
    messages: ChatMessage[];
    pendingDrafts: PendingDraft[];
    pendingClaimDrafts: PendingClaimDraft[];
  }>(`/chat/threads/${threadId}`);
  return {
    threadId,
    messages: data.messages ?? [],
    pendingDrafts: data.pendingDrafts ?? [],
    pendingClaimDrafts: data.pendingClaimDrafts ?? [],
  };
}

export async function loadStoredThread(): Promise<ChatThread> {
  const threadId = await getStoredThreadId();
  if (!threadId) return emptyThread();
  try {
    return await getThread(threadId);
  } catch (error) {
    if (errorCode(error) === 'THREAD_NOT_FOUND') {
      await clearStoredThreadId();
      return emptyThread();
    }
    throw error;
  }
}

export interface SendChatResponse {
  threadId: string;
  reply: string;
  choices: string[];
  pendingDrafts: PendingDraft[];
  pendingClaimDrafts: PendingClaimDraft[];
}

export async function sendChatMessage(input: {
  message: string;
  threadId: string | null;
}): Promise<SendChatResponse> {
  const {data} = await apiClient.post<SendChatResponse>('/chat', {
    message: input.message,
    ...(input.threadId ? {threadId: input.threadId} : {}),
  });
  return data;
}

export async function confirmChatDraft(draftId: string): Promise<void> {
  await apiClient.post(`/chat/drafts/${draftId}/confirm`);
}

export async function confirmClaimChatDraft(draftId: string): Promise<void> {
  await apiClient.post(`/chat/claim-drafts/${draftId}/confirm`);
}
