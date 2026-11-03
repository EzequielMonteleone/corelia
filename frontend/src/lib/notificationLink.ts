import type {NotificationItem} from '@/types/notification';

export function notificationHref(item: Pick<NotificationItem, 'kind' | 'buildingId' | 'entityId'>) {
  const buildingId = encodeURIComponent(item.buildingId);
  const entityId = encodeURIComponent(item.entityId);
  if (item.kind === 'CLAIM_UPDATED') {
    return `/dashboard/claims?buildingId=${buildingId}&claimId=${entityId}`;
  }
  return `/dashboard/documents?buildingId=${buildingId}&documentId=${entityId}`;
}
