'use client';

import {FormEvent, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import apiClient from '@/lib/apiClient';
import {Button} from '@/components/ui/Button';
import {PageHeader} from '@/components/dashboard/PageHeader';

type ChatMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
};

type PendingDraft = {
  id: string;
  amenityName: string;
  unitName: string;
  buildingName: string;
  startsAt: string;
  notes: string | null;
};

const THREAD_KEY = 'corelia-chat-thread';

function errorMessage(err: unknown, fallback: string, notConfigured: string) {
  const code =
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'error' in err.response.data
      ? String(err.response.data.error)
      : '';
  if (code === 'CHAT_NOT_CONFIGURED') return notConfigured;
  return fallback;
}

export default function ChatPage() {
  const t = useTranslations('Chat');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(THREAD_KEY);
    if (!stored) return;
    let cancelled = false;
    apiClient
      .get(`/chat/threads/${stored}`)
      .then(response => {
        if (cancelled) return;
        setThreadId(stored);
        setMessages(response.data.messages ?? []);
        setDrafts(response.data.pendingDrafts ?? []);
      })
      .catch(() => {
        sessionStorage.removeItem(THREAD_KEY);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({top: listRef.current.scrollHeight});
  }, [messages, drafts, sending]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setError(null);
    setSending(true);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'USER',
      content: text,
    };
    setMessages(current => [...current, optimistic]);
    try {
      const response = await apiClient.post('/chat', {
        message: text,
        ...(threadId ? {threadId} : {}),
      });
      const nextThreadId = response.data.threadId as string;
      setThreadId(nextThreadId);
      sessionStorage.setItem(THREAD_KEY, nextThreadId);
      setMessages(current => [
        ...current,
        {
          id: `local-assistant-${Date.now()}`,
          role: 'ASSISTANT',
          content: response.data.reply as string,
        },
      ]);
      setDrafts(response.data.pendingDrafts ?? []);
    } catch (err) {
      setError(errorMessage(err, t('error'), t('notConfigured')));
    } finally {
      setSending(false);
    }
  }

  async function confirmDraft(draftId: string) {
    setConfirmingId(draftId);
    setError(null);
    try {
      await apiClient.post(`/chat/drafts/${draftId}/confirm`);
      if (threadId) {
        const response = await apiClient.get(`/chat/threads/${threadId}`);
        setMessages(response.data.messages ?? []);
        setDrafts(response.data.pendingDrafts ?? []);
      } else {
        setDrafts(current => current.filter(draft => draft.id !== draftId));
      }
    } catch (err) {
      setError(errorMessage(err, t('error'), t('notConfigured')));
    } finally {
      setConfirmingId(null);
    }
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
        {messages.map(message => (
          <div
            key={message.id}
            className={
              message.role === 'USER'
                ? 'ml-auto max-w-2xl rounded-2xl bg-blue-500/15 px-4 py-3 text-blue-50'
                : 'max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-gray-100'
            }>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {drafts.map(draft => (
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
              isLoading={confirmingId === draft.id}
              onClick={() => confirmDraft(draft.id)}>
              {confirmingId === draft.id ? t('confirming') : t('confirm')}
            </Button>
          </div>
        ))}
        {sending && <p className="text-sm text-gray-500">{t('thinking')}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex gap-3 border-t border-white/10 px-8 py-4">
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
        <Button type="submit" isLoading={sending} disabled={!input.trim()}>
          {t('send')}
        </Button>
      </form>
    </div>
  );
}
