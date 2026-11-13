import type {NotificationItem} from '@/types/notification';

const CLAIM_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En curso',
  CLOSED: 'Cerrado',
};

export function notificationPhrase(item: NotificationItem): string {
  if (item.kind === 'BYLAW_PUBLISHED') {
    return `Nuevo reglamento: ${item.title}`;
  }
  if (item.kind === 'NOTICE_PUBLISHED') {
    return `Nuevo aviso: ${item.title}`;
  }
  const status = item.claimStatus
    ? CLAIM_STATUS_LABELS[item.claimStatus] ?? item.claimStatus
    : '';
  return `Tu reclamo «${item.title}» está ${status.toLowerCase()}`;
}
