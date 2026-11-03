'use client';

import {useCallback, useEffect, useRef, useSyncExternalStore} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslations} from 'next-intl';
import apiClient from '@/lib/apiClient';
import {useRouter} from '@/i18n/navigation';
import {notificationHref} from '@/lib/notificationLink';
import {NotificationItem, NotificationList} from '@/types/notification';

type BrowserPermission = NotificationPermission | 'unsupported' | null;

const permissionListeners = new Set<() => void>();

function subscribeBrowserPermission(onStoreChange: () => void) {
  permissionListeners.add(onStoreChange);
  return () => {
    permissionListeners.delete(onStoreChange);
  };
}

function readBrowserPermission(): BrowserPermission {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

function notifyBrowserPermission() {
  for (const listener of permissionListeners) listener();
}

export function useNotifications() {
  const t = useTranslations('Notifications');
  const tClaims = useTranslations('Claims');
  const router = useRouter();
  const queryClient = useQueryClient();
  const seen = useRef<Set<string> | null>(null);
  const browserPermission = useSyncExternalStore(
    subscribeBrowserPermission,
    readBrowserPermission,
    () => null,
  );

  const query = useQuery<NotificationList>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/me/notifications');
      return res.data;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/me/notifications/${id}/read`);
      return res.data as NotificationItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
  });

  const phrase = useCallback(
    (item: NotificationItem) => {
      if (item.kind === 'BYLAW_PUBLISHED')
        return t('bylaw', {title: item.title});
      if (item.kind === 'NOTICE_PUBLISHED')
        return t('notice', {title: item.title});
      const status = item.claimStatus
        ? tClaims(`status.${item.claimStatus}`)
        : '';
      return t('claim', {title: item.title, status});
    },
    [t, tClaims],
  );

  useEffect(() => {
    const items = query.data?.notifications;
    if (!items) return;
    if (seen.current === null) {
      seen.current = new Set(items.map(item => item.id));
      return;
    }
    const fresh = items.filter(
      item => !item.readAt && !seen.current?.has(item.id),
    );
    for (const item of items) seen.current.add(item.id);
    if (!document.hidden) return;
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }
    for (const item of fresh) {
      const notice = new Notification(phrase(item), {tag: item.id});
      notice.onclick = () => {
        window.focus();
        notice.close();
        markRead.mutate(item.id);
        router.push(notificationHref(item));
      };
    }
  }, [query.data, markRead.mutate, router, phrase, markRead]);

  const requestBrowserPermission = () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;
    void Notification.requestPermission().then(() => {
      notifyBrowserPermission();
    });
  };

  return {
    ...query,
    phrase,
    markRead,
    browserPermission,
    requestBrowserPermission,
  };
}
