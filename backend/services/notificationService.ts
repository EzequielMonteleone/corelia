import type {ClaimStatus, Notification, Prisma} from '@prisma/client';
import {prisma} from '../prismaClient.js';
import {
  clipNotificationTitle,
  documentNotice,
  withoutActor,
} from '../lib/notificationRules.js';

const LIST_LIMIT = 30;

export class NotificationError extends Error {
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.status = status;
  }
}

function present(row: Notification) {
  return {
    id: row.id,
    buildingId: row.buildingId,
    kind: row.kind,
    entityId: row.entityId,
    title: row.title,
    claimStatus: row.claimStatus,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function notifyDocumentPublished(params: {
  buildingId: string;
  entityId: string;
  title: string;
  kind: 'BYLAW' | 'NOTICE';
  actorUserId: string;
}) {
  const members = await prisma.buildingUser.findMany({
    where: {
      buildingId: params.buildingId,
      user: {isActive: true, deleted: false},
    },
    select: {userId: true},
  });
  const recipients = withoutActor(
    members.map(member => member.userId),
    params.actorUserId,
  );
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map(userId => ({
      userId,
      buildingId: params.buildingId,
      kind: documentNotice(params.kind),
      entityId: params.entityId,
      title: clipNotificationTitle(params.title),
    })),
  });
}

export async function notifyClaimUpdated(
  db: Prisma.TransactionClient,
  params: {
    userId: string;
    buildingId: string;
    entityId: string;
    title: string;
    claimStatus: ClaimStatus;
  },
) {
  await db.notification.create({
    data: {
      userId: params.userId,
      buildingId: params.buildingId,
      kind: 'CLAIM_UPDATED',
      entityId: params.entityId,
      title: clipNotificationTitle(params.title),
      claimStatus: params.claimStatus,
    },
  });
}

export async function listNotifications(userId: string) {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
      take: LIST_LIMIT,
    }),
    prisma.notification.count({where: {userId, readAt: null}}),
  ]);
  return {
    unreadCount,
    notifications: rows.map(present),
  };
}

export async function markNotificationRead(userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: {id, userId},
  });
  if (!existing) throw new NotificationError('NOTIFICATION_NOT_FOUND', 404);
  if (existing.readAt) return present(existing);
  const row = await prisma.notification.update({
    where: {id: existing.id},
    data: {readAt: new Date()},
  });
  return present(row);
}
