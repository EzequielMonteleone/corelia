export type NotificationKind =
  | 'BYLAW_PUBLISHED'
  | 'NOTICE_PUBLISHED'
  | 'CLAIM_UPDATED';

export type NotificationItem = {
  id: string;
  buildingId: string;
  kind: NotificationKind;
  entityId: string;
  title: string;
  claimStatus: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationList = {
  unreadCount: number;
  notifications: NotificationItem[];
};
