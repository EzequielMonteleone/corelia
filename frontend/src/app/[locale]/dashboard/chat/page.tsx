'use client';

import {SubmitEvent, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/Button';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {
  useChatThread,
  useConfirmChatDraft,
  useSendChatMessage,
} from '@/hooks/useChat';
import {errorCode} from '@/lib/apiError';

function withoutChoiceLines(content: string, choices: string[]) {
  const hidden = new Set(choices.map(choice => `- ${choice}`));
  return content
    .split('\n')
    .filter(line => !hidden.has(line))
    .join('\n')
    .trim();
}

export default function ChatPage() {
  const t = useTranslations('Chat');
  const thread = useChatThread();
  const sendMessage = useSendChatMessage();
  const confirmDraft = useConfirmChatDraft();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => thread.data?.messages ?? [],
    [thread.data?.messages],
  );
  const drafts = useMemo(
    () => thread.data?.pendingDrafts ?? [],
    [thread.data?.pendingDrafts],
  );
  const failure = sendMessage.error ?? confirmDraft.error;
  const error = failure
    ? errorCode(failure) === 'CHAT_NOT_CONFIGURED'
      ? t('notConfigured')
      : t('error')
    : null;

  useEffect(() => {
    listRef.current?.scrollTo({top: listRef.current.scrollHeight});
  }, [messages, drafts, sendMessage.isPending]);

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sendMessage.isPending) return;
    setInput('');
    confirmDraft.reset();
    sendMessage.mutate(text);
  }

  function onConfirm(draftId: string) {
    sendMessage.reset();
    confirmDraft.mutate(draftId);
  }

  function onChoose(choice: string) {
    if (sendMessage.isPending) return;
    confirmDraft.reset();
    sendMessage.mutate(choice);
  }

  const when = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));

  return (
    <div className="flex h-screen flex-col text-white">
      <div className="shrink-0 px-8 pt-8">
        <PageHeader title={t('title')} description={t('description')} />
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-8 pb-4">
        {messages.length === 0 && <p className="text-gray-500">{t('empty')}</p>}
        {messages.map((message, index) => {
          const choices =
            index === messages.length - 1 ? (message.choices ?? []) : [];
          const text =
            choices.length > 0
              ? withoutChoiceLines(message.content, choices)
              : message.content;
          return (
            <div
              key={message.id}
              className={
                message.role === 'USER'
                  ? 'ml-auto max-w-2xl rounded-2xl bg-blue-500/15 px-4 py-3 text-blue-50'
                  : 'max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-gray-100'
              }>
              {text && <p className="whitespace-pre-wrap">{text}</p>}
              {choices.length > 0 && (
                <div
                  className={
                    text ? 'mt-3 flex flex-col gap-2' : 'flex flex-col gap-2'
                  }>
                  {choices.map(choice => (
                    <Button
                      key={choice}
                      type="button"
                      intent="outline"
                      size="sm"
                      fullWidth
                      className="justify-start text-left"
                      disabled={sendMessage.isPending}
                      onClick={() => onChoose(choice)}>
                      {choice}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {drafts.map(draft => {
          const confirming =
            confirmDraft.isPending && confirmDraft.variables === draft.id;
          return (
            <div
              key={draft.id}
              className="max-w-2xl rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3">
              <p className="text-sm text-blue-100">
                {t('draft', {
                  amenity: draft.amenityName,
                  unit: draft.unitName,
                  when: when(draft.startsAt),
                })}
              </p>
              <p className="mt-1 text-xs text-gray-400">{draft.buildingName}</p>
              <Button
                className="mt-3"
                size="sm"
                isLoading={confirming}
                onClick={() => onConfirm(draft.id)}>
                {confirming ? t('confirming') : t('confirm')}
              </Button>
            </div>
          );
        })}
        {sendMessage.isPending && (
          <p className="text-sm text-gray-500">{t('thinking')}</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex gap-3 border-t border-white/10 px-8 py-4 items-center">
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          placeholder={t('placeholder')}
          className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-500/50"
        />
        <Button
          type="submit"
          isLoading={sendMessage.isPending}
          disabled={!input.trim()}>
          {t('send')}
        </Button>
      </form>
    </div>
  );
}
