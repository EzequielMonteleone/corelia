import {
  confirmChatDraft,
  confirmClaimChatDraft,
  getStoredThreadId,
  getThread,
  loadStoredThread,
  sendChatMessage,
  storeThreadId,
} from '@/api/chat.api';
import {queryKeys} from '@/api/queryKeys';
import type {ChatMessage, ChatThread} from '@/types/chat';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

type SendResult = Awaited<ReturnType<typeof sendChatMessage>>;

export function useChatThread() {
  return useQuery({
    queryKey: queryKeys.chatThread,
    queryFn: loadStoredThread,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string): Promise<SendResult> => {
      const current = queryClient.getQueryData<ChatThread>(
        queryKeys.chatThread,
      );
      const threadId = current?.threadId ?? (await getStoredThreadId());
      return sendChatMessage({message, threadId});
    },
    onMutate: async message => {
      await queryClient.cancelQueries({queryKey: queryKeys.chatThread});
      const previous = queryClient.getQueryData<ChatThread>(
        queryKeys.chatThread,
      );
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'USER',
        content: message,
      };
      queryClient.setQueryData<ChatThread>(queryKeys.chatThread, current => ({
        threadId: current?.threadId ?? null,
        messages: [...(current?.messages ?? []), optimistic],
        pendingDrafts: current?.pendingDrafts ?? [],
        pendingClaimDrafts: current?.pendingClaimDrafts ?? [],
      }));
      return {previous};
    },
    onError: (_error, _message, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.chatThread, context.previous);
      }
    },
    onSuccess: async data => {
      await storeThreadId(data.threadId);
      queryClient.setQueryData<ChatThread>(queryKeys.chatThread, current => ({
        threadId: data.threadId,
        messages: [
          ...(current?.messages ?? []),
          {
            id: `local-assistant-${Date.now()}`,
            role: 'ASSISTANT' as const,
            content: data.reply,
            choices: data.choices ?? [],
          },
        ],
        pendingDrafts: data.pendingDrafts ?? [],
        pendingClaimDrafts: data.pendingClaimDrafts ?? [],
      }));
    },
  });
}

async function reloadThread(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<ChatThread | null> {
  const current = queryClient.getQueryData<ChatThread>(queryKeys.chatThread);
  const threadId = current?.threadId ?? (await getStoredThreadId());
  if (!threadId) return null;
  return getThread(threadId);
}

export function useConfirmChatDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string): Promise<ChatThread | null> => {
      await confirmChatDraft(draftId);
      return reloadThread(queryClient);
    },
    onMutate: async draftId => {
      await queryClient.cancelQueries({queryKey: queryKeys.chatThread});
      const previous = queryClient.getQueryData<ChatThread>(
        queryKeys.chatThread,
      );
      queryClient.setQueryData<ChatThread>(queryKeys.chatThread, current =>
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
    onError: (_error, _draftId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.chatThread, context.previous);
      }
    },
    onSuccess: data => {
      if (data) queryClient.setQueryData(queryKeys.chatThread, data);
    },
  });
}

export function useConfirmClaimDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string): Promise<ChatThread | null> => {
      await confirmClaimChatDraft(draftId);
      return reloadThread(queryClient);
    },
    onMutate: async draftId => {
      await queryClient.cancelQueries({queryKey: queryKeys.chatThread});
      const previous = queryClient.getQueryData<ChatThread>(
        queryKeys.chatThread,
      );
      queryClient.setQueryData<ChatThread>(queryKeys.chatThread, current =>
        current
          ? {
              ...current,
              pendingClaimDrafts: current.pendingClaimDrafts.filter(
                draft => draft.id !== draftId,
              ),
            }
          : current,
      );
      return {previous};
    },
    onError: (_error, _draftId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.chatThread, context.previous);
      }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: queryKeys.claimsRoot});
      if (data) queryClient.setQueryData(queryKeys.chatThread, data);
    },
  });
}
