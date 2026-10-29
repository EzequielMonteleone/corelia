import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {errorCode} from '@/lib/apiError';
import type {ChatMessage, ChatThread, PendingDraft} from '@/types/chat';

const THREAD_STORAGE_KEY = 'corelia-chat-thread';
const chatThreadKey = ['chat', 'thread'] as const;

const emptyThread = (): ChatThread => ({
  threadId: null,
  messages: [],
  pendingDrafts: [],
});

function storedThreadId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(THREAD_STORAGE_KEY);
}

export function useChatThread() {
  return useQuery({
    queryKey: chatThreadKey,
    queryFn: async (): Promise<ChatThread> => {
      const threadId = storedThreadId();
      if (!threadId) return emptyThread();
      try {
        const res = await apiClient.get(`/chat/threads/${threadId}`);
        return {
          threadId,
          messages: res.data.messages ?? [],
          pendingDrafts: res.data.pendingDrafts ?? [],
        };
      } catch (err) {
        if (errorCode(err) === 'THREAD_NOT_FOUND') {
          sessionStorage.removeItem(THREAD_STORAGE_KEY);
          return emptyThread();
        }
        throw err;
      }
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const threadId =
        queryClient.getQueryData<ChatThread>(chatThreadKey)?.threadId ??
        storedThreadId();
      const res = await apiClient.post('/chat', {
        message,
        ...(threadId ? {threadId} : {}),
      });
      return res.data as {
        threadId: string;
        reply: string;
        choices: string[];
        pendingDrafts: PendingDraft[];
      };
    },
    onMutate: async message => {
      await queryClient.cancelQueries({queryKey: chatThreadKey});
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'USER',
        content: message,
      };
      queryClient.setQueryData<ChatThread>(chatThreadKey, current => ({
        threadId: current?.threadId ?? storedThreadId(),
        messages: [...(current?.messages ?? []), optimistic],
        pendingDrafts: current?.pendingDrafts ?? [],
      }));
    },
    onSuccess: data => {
      sessionStorage.setItem(THREAD_STORAGE_KEY, data.threadId);
      queryClient.setQueryData<ChatThread>(chatThreadKey, current => ({
        threadId: data.threadId,
        messages: [
          ...(current?.messages ?? []),
          {
            id: `local-assistant-${Date.now()}`,
            role: 'ASSISTANT',
            content: data.reply,
            choices: data.choices ?? [],
          },
        ],
        pendingDrafts: data.pendingDrafts ?? [],
      }));
    },
  });
}

export function useConfirmChatDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftId: string) => {
      await apiClient.post(`/chat/drafts/${draftId}/confirm`);
      const threadId =
        queryClient.getQueryData<ChatThread>(chatThreadKey)?.threadId ??
        storedThreadId();
      if (!threadId) return null;
      const res = await apiClient.get(`/chat/threads/${threadId}`);
      return {
        threadId,
        messages: (res.data.messages ?? []) as ChatMessage[],
        pendingDrafts: (res.data.pendingDrafts ?? []) as PendingDraft[],
      };
    },
    onMutate: async draftId => {
      await queryClient.cancelQueries({queryKey: chatThreadKey});
      const previous = queryClient.getQueryData<ChatThread>(chatThreadKey);
      queryClient.setQueryData<ChatThread>(chatThreadKey, current =>
        current
          ? {
              ...current,
              pendingDrafts: current.pendingDrafts.filter(
                draft => draft.id !== draftId,
              ),
            }
          : current,
      );
      return {previous};
    },
    onError: (_err, _draftId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(chatThreadKey, context.previous);
      }
    },
    onSuccess: data => {
      if (!data) return;
      queryClient.setQueryData<ChatThread>(chatThreadKey, data);
    },
  });
}
