import {apiClient} from '@/api/client';
import type {NotificationItem, NotificationList} from '@/types/notification';

export async function listNotifications(): Promise<NotificationList> {
  const {data} = await apiClient.get<NotificationList>('/me/notifications');
  return data;
}

export async function markNotificationRead(
  id: string,
): Promise<NotificationItem> {
  const {data} = await apiClient.post<NotificationItem>(
    `/me/notifications/${id}/read`,
  );
  return data;
}
