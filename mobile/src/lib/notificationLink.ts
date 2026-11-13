import type {NotificationItem} from '@/types/notification';

export type NotificationTarget =
  | {pathname: '/claims'; params: {buildingId: string; claimId: string}}
  | {pathname: '/documents'; params: {buildingId: string; documentId: string}};

export function notificationTarget(
  item: Pick<NotificationItem, 'kind' | 'buildingId' | 'entityId'>,
): NotificationTarget {
  if (item.kind === 'CLAIM_UPDATED') {
    return {
      pathname: '/claims',
      params: {buildingId: item.buildingId, claimId: item.entityId},
    };
  }
  return {
    pathname: '/documents',
    params: {buildingId: item.buildingId, documentId: item.entityId},
  };
}
