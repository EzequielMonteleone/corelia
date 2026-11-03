'use client';

import {useEffect, useRef, useState} from 'react';
import {Bell} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {useNotifications} from '@/hooks/useNotifications';
import {notificationHref} from '@/lib/notificationLink';
import {cn} from '@/lib/utils';

export function NotificationBell() {
  const t = useTranslations('Notifications');
  const router = useRouter();
  const {data, phrase, markRead, browserPermission, requestBrowserPermission} =
    useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const openItem = (id: string, href: string) => {
    markRead.mutate(id);
    setOpen(false);
    router.push(href);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t('title')}
        onClick={() => setOpen(value => !value)}
        className="relative rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-full top-0 z-30 ml-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-xl">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">
            {t('title')}
          </div>
          {browserPermission === 'default' && (
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="w-full border-b border-white/10 px-4 py-3 text-left text-sm text-blue-300 hover:bg-white/5">
              {t('enableBrowser')}
            </button>
          )}
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">{t('empty')}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item.id, notificationHref(item))}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm hover:bg-white/5',
                      item.readAt ? 'text-gray-400' : 'text-white',
                    )}>
                    {phrase(item)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
