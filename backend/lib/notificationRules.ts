import type {ClaimStatusName, ClaimUpdateInput} from './claimRules.js';

export const NOTIFICATION_KINDS = [
  'BYLAW_PUBLISHED',
  'NOTICE_PUBLISHED',
  'CLAIM_UPDATED',
] as const;

export type NotificationKindName = (typeof NOTIFICATION_KINDS)[number];

const MAX_TITLE = 120;

export function clipNotificationTitle(title: string) {
  const trimmed = title.trim();
  if (trimmed.length <= MAX_TITLE) return trimmed;
  return trimmed.slice(0, MAX_TITLE);
}

export function documentNotice(
  kind: 'BYLAW' | 'NOTICE',
): 'BYLAW_PUBLISHED' | 'NOTICE_PUBLISHED' {
  return kind === 'BYLAW' ? 'BYLAW_PUBLISHED' : 'NOTICE_PUBLISHED';
}

export function claimUpdateNotice(
  previous: {
    authorUserId: string;
    status: ClaimStatusName;
    reply: string | null;
  },
  update: ClaimUpdateInput,
  actorUserId: string,
): {kind: 'CLAIM_UPDATED'; claimStatus: ClaimStatusName} | null {
  if (actorUserId === previous.authorUserId) return null;
  const statusChanged =
    update.status !== undefined && update.status !== previous.status;
  const replyChanged =
    update.reply !== undefined && update.reply !== previous.reply;
  if (!statusChanged && !replyChanged) return null;
  return {
    kind: 'CLAIM_UPDATED',
    claimStatus: update.status ?? previous.status,
  };
}

export function withoutActor(userIds: string[], actorUserId: string) {
  return userIds.filter(userId => userId !== actorUserId);
}
