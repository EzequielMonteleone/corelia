import {prisma} from '../prismaClient.js';

export type AuditAction =
  | 'EXPENSE_PERIOD_CREATED'
  | 'EXPENSE_PERIOD_UPDATED'
  | 'EXPENSE_PERIOD_DELETED'
  | 'EXPENSE_CREATED'
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'USER_PASSWORD_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'USER_ROLE_CHANGED'
  | 'USER_ACTIVE_CHANGED';

type CreateAuditLogInput = {
  action: AuditAction;
  entityType: 'EXPENSE_PERIOD' | 'EXPENSE' | 'PAYMENT' | 'USER';
  entityId: string;
  periodId?: string;
  buildingId: string | null;
  actorUserId: string;
  metadata?: Record<string, unknown>;
};

type RawAuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  periodId: string | null;
  buildingId: string | null;
  actorUserId: string;
  metadata: unknown;
  createdAt: Date;
};

type UserAuditLogRow = RawAuditLogRow & {
  actorFirstName: string | null;
  actorLastName: string | null;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  const payload = input.metadata ? JSON.stringify(input.metadata) : null;

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "AuditLog" (
        "id",
        "action",
        "entityType",
        "entityId",
        "periodId",
        "buildingId",
        "actorUserId",
        "metadata",
        "createdAt"
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
    `,
    input.action,
    input.entityType,
    input.entityId,
    input.periodId ?? null,
    input.buildingId,
    input.actorUserId,
    payload,
  );
}

export async function getAuditLogsByPeriod(periodId: string, limit = 30) {
  const rows = await prisma.$queryRawUnsafe<RawAuditLogRow[]>(
    `
      SELECT
        al.id,
        al."action",
        al."entityType",
        al."entityId",
        al."periodId",
        al."buildingId",
        al."actorUserId",
        al.metadata,
        al."createdAt"
      FROM "AuditLog" al
      WHERE al."periodId" = $1
      ORDER BY al."createdAt" DESC
      LIMIT $2
    `,
    periodId,
    limit,
  );

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getAuditLogsByUser(userId: string, limit = 30) {
  const rows = await prisma.$queryRawUnsafe<UserAuditLogRow[]>(
    `
      SELECT
        al.id,
        al."action",
        al."entityType",
        al."entityId",
        al."periodId",
        al."buildingId",
        al."actorUserId",
        al.metadata,
        al."createdAt",
        actor."firstName" AS "actorFirstName",
        actor."lastName" AS "actorLastName"
      FROM "AuditLog" al
      LEFT JOIN "User" actor ON actor.id = al."actorUserId"
      WHERE al."entityType" = 'USER' AND al."entityId" = $1
      ORDER BY al."createdAt" DESC
      LIMIT $2
    `,
    userId,
    limit,
  );

  return rows.map(row => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    periodId: row.periodId,
    buildingId: row.buildingId,
    actorUserId: row.actorUserId,
    actorName:
      [row.actorFirstName, row.actorLastName].filter(Boolean).join(' ') || null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}
