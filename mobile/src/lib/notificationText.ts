import i18n from '@/i18n';
import type {NotificationItem} from '@/types/notification';

const CLAIM_STATUS_KEYS = {
  OPEN: 'Claims.status.OPEN',
  IN_PROGRESS: 'Claims.status.IN_PROGRESS',
  CLOSED: 'Claims.status.CLOSED',
} as const;

export function notificationPhrase(item: NotificationItem): string {
  if (item.kind === 'BYLAW_PUBLISHED') {
    return i18n.t('Notifications.bylaw', {title: item.title});
  }
  if (item.kind === 'NOTICE_PUBLISHED') {
    return i18n.t('Notifications.notice', {title: item.title});
  }
  const statusKey = item.claimStatus
    ? CLAIM_STATUS_KEYS[item.claimStatus as keyof typeof CLAIM_STATUS_KEYS]
    : undefined;
  const status = statusKey ? i18n.t(statusKey).toLocaleLowerCase() : '';
  return i18n.t('Notifications.claim', {title: item.title, status});
}