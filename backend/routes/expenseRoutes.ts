import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {findUserById} from '../services/userService.js';
import {ExpensePeriodStatus} from '@prisma/client';
import {
  getExpensePeriods,
  createExpensePeriod,
  getExpensePeriodDetail,
  updateExpensePeriod,
  deleteExpensePeriod,
  createExpense,
  updateExpense,
  deleteExpense,
  createPayment,
  updatePayment,
  getBuildingCollectionSummary,
  buildExpensePeriodCsv,
  buildExpensePeriodPdf,
} from '../services/expenseService.js';
import {
  createAuditLog,
  getAuditLogsByPeriod,
} from '../services/auditService.js';
import {canAccessBuilding, toBuildingMember} from '../lib/buildingAccess.js';
import type {MembershipUser, UnitLink} from '../types/member.js';
import {expenseScope} from '../lib/chatAccess.js';
import {parsePositiveMoney} from '../lib/money.js';

function sendMoneyError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof Error) {
    if (
      err.message === 'INVALID_AMOUNT' ||
      err.message === 'UNIT_NOT_IN_BUILDING' ||
      err.message === 'AMOUNT_EXCEEDS_BALANCE' ||
      err.message === 'PERIOD_CLOSED' ||
      err.message === 'EXPENSE_ALREADY_PAID' ||
      err.message === 'EXPENSE_HAS_PAYMENTS'
    ) {
      return res.status(400).json({error: err.message});
    }
    if (
      err.message === 'EXPENSE_NOT_FOUND' ||
      err.message === 'EXPENSE_PERIOD_NOT_FOUND' ||
      err.message === 'PAYMENT_NOT_FOUND'
    ) {
      return res.status(404).json({error: err.message});
    }
    if (err.message === 'INSUFFICIENT_PERMISSIONS') {
      return res.status(403).json({error: err.message});
    }
  }
  return next(err);
}

function hasRoleForBuilding(
  user: MembershipUser,
  buildingId: string,
  level: 'admin' | 'member',
) {
  return canAccessBuilding(toBuildingMember(user), buildingId, level);
}

function toExpenseActor(
  user: MembershipUser & {userUnits: Pick<UnitLink, 'unitId' | 'unit'>[]},
) {
  return {
    ...toBuildingMember(user),
    units: user.userUnits.map(link => ({
      id: link.unitId,
      buildingId: link.unit.buildingId,
    })),
  };
}

// ─── Building-scoped period routes (/buildings/:buildingId/expense-periods) ───

export const buildingPeriodRouter = Router({mergeParams: true});

// GET /buildings/:buildingId/expense-periods
buildingPeriodRouter.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      if (!hasRoleForBuilding(user, buildingId, 'member')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const periods = await getExpensePeriods(buildingId);
      return res.json(periods);
    } catch (err) {
      return next(err);
    }
  },
);

// GET /buildings/:buildingId/expense-periods/summary
buildingPeriodRouter.get(
  '/summary',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      if (!hasRoleForBuilding(user, buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const summary = await getBuildingCollectionSummary(buildingId);
      return res.json(summary);
    } catch (err) {
      return next(err);
    }
  },
);

// POST /buildings/:buildingId/expense-periods
buildingPeriodRouter.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      if (!hasRoleForBuilding(user, buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const period = req.body?.period as string | undefined;
      if (!period?.trim()) {
        return res.status(400).json({error: 'PERIOD_REQUIRED'});
      }

      const expensePeriod = await createExpensePeriod(
        buildingId,
        period.trim(),
      );
      await createAuditLog({
        action: 'EXPENSE_PERIOD_CREATED',
        entityType: 'EXPENSE_PERIOD',
        entityId: expensePeriod.id,
        periodId: expensePeriod.id,
        buildingId,
        actorUserId: req.user.id,
        metadata: {period: expensePeriod.period},
      });
      return res.status(201).json(expensePeriod);
    } catch (err) {
      return next(err);
    }
  },
);

// ─── Standalone period routes (/expense-periods/:periodId) ────────────────────

export const periodRouter = Router();

// GET /expense-periods/:periodId
periodRouter.get(
  '/:periodId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const periodId = req.params.periodId as string;
      const detail = await getExpensePeriodDetail(periodId);
      if (!detail)
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});

      const scope = expenseScope(toExpenseActor(user), detail.buildingId);
      if (!scope.ok) {
        return res.status(403).json({error: scope.error});
      }

      if (scope.unitIds) {
        const allowed = new Set(scope.unitIds);
        return res.json({
          ...detail,
          expenses: detail.expenses.filter(expense =>
            allowed.has(expense.unitId),
          ),
        });
      }

      return res.json(detail);
    } catch (err) {
      return next(err);
    }
  },
);

// PUT /expense-periods/:periodId
periodRouter.put(
  '/:periodId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const periodId = req.params.periodId as string;
      const detail = await getExpensePeriodDetail(periodId);
      if (!detail)
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});

      if (!hasRoleForBuilding(user, detail.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const status = req.body?.status as ExpensePeriodStatus | undefined;
      if (!status || !Object.values(ExpensePeriodStatus).includes(status)) {
        return res.status(400).json({error: 'INVALID_STATUS'});
      }

      const updated = await updateExpensePeriod(periodId, status);
      await createAuditLog({
        action: 'EXPENSE_PERIOD_UPDATED',
        entityType: 'EXPENSE_PERIOD',
        entityId: updated.id,
        periodId: updated.id,
        buildingId: detail.buildingId,
        actorUserId: req.user.id,
        metadata: {status},
      });
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  },
);

// DELETE /expense-periods/:periodId
periodRouter.delete(
  '/:periodId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const periodId = req.params.periodId as string;
      const detail = await getExpensePeriodDetail(periodId);
      if (!detail)
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});

      if (!hasRoleForBuilding(user, detail.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      await deleteExpensePeriod(periodId);
      await createAuditLog({
        action: 'EXPENSE_PERIOD_DELETED',
        entityType: 'EXPENSE_PERIOD',
        entityId: periodId,
        periodId,
        buildingId: detail.buildingId,
        actorUserId: req.user.id,
        metadata: {period: detail.period},
      });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
);

// GET /expense-periods/:periodId/export
periodRouter.get(
  '/:periodId/export',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const periodId = req.params.periodId as string;
      const detail = await getExpensePeriodDetail(periodId);
      if (!detail) {
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});
      }

      const scope = expenseScope(toExpenseActor(user), detail.buildingId);
      if (!scope.ok) {
        return res.status(403).json({error: scope.error});
      }

      const format = String(req.query.format ?? 'csv').toLowerCase();
      if (format !== 'csv' && format !== 'pdf') {
        return res.status(400).json({error: 'INVALID_EXPORT_FORMAT'});
      }

      const unitIds = scope.unitIds;

      const safePeriod = detail.period.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (format === 'csv') {
        const csv = await buildExpensePeriodCsv(periodId, unitIds);
        if (!csv)
          return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="expense-period-${safePeriod}.csv"`,
        );
        return res.send(csv);
      }

      const pdf = await buildExpensePeriodPdf(periodId, unitIds);
      if (!pdf)
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="expense-period-${safePeriod}.pdf"`,
      );
      return res.send(pdf);
    } catch (err) {
      return next(err);
    }
  },
);

// GET /expense-periods/:periodId/audit-logs
periodRouter.get(
  '/:periodId/audit-logs',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const periodId = req.params.periodId as string;
      const detail = await getExpensePeriodDetail(periodId);
      if (!detail) {
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});
      }

      if (!hasRoleForBuilding(user, detail.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const logs = await getAuditLogsByPeriod(periodId, 30);
      return res.json(logs);
    } catch (err) {
      return next(err);
    }
  },
);

// POST /expense-periods/:periodId/expenses
periodRouter.post(
  '/:periodId/expenses',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const periodId = req.params.periodId as string;
      const detail = await getExpensePeriodDetail(periodId);
      if (!detail)
        return res.status(404).json({error: 'EXPENSE_PERIOD_NOT_FOUND'});

      if (!hasRoleForBuilding(user, detail.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const unitId = req.body?.unitId as string | undefined;
      const amount = req.body?.amount as number | undefined;

      if (!unitId) return res.status(400).json({error: 'UNIT_ID_REQUIRED'});
      if (typeof amount !== 'number') {
        return res.status(400).json({error: 'AMOUNT_REQUIRED'});
      }
      const parsedAmount = parsePositiveMoney(amount);
      if (parsedAmount === 'INVALID_AMOUNT') {
        return res.status(400).json({error: 'INVALID_AMOUNT'});
      }

      const expense = await createExpense({
        buildingId: detail.buildingId,
        unitId,
        periodId,
        amount: parsedAmount,
      });
      await createAuditLog({
        action: 'EXPENSE_CREATED',
        entityType: 'EXPENSE',
        entityId: expense.id,
        periodId,
        buildingId: detail.buildingId,
        actorUserId: req.user.id,
        metadata: {periodId, unitId, amount: parsedAmount},
      });
      return res.status(201).json(expense);
    } catch (err) {
      return sendMoneyError(err, res, next);
    }
  },
);

// ─── Standalone expense routes (/expenses/:id) ────────────────────────────────

export const expenseRouter = Router();

// PUT /expenses/:id
expenseRouter.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const expenseId = req.params.id as string;

      // Fetch expense to get buildingId for auth check
      const existing = await import('../prismaClient.js').then(m =>
        m.prisma.expense.findUnique({where: {id: expenseId}}),
      );
      if (!existing) return res.status(404).json({error: 'EXPENSE_NOT_FOUND'});

      if (!hasRoleForBuilding(user, existing.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const {amount} = req.body as {amount?: unknown};
      if (amount !== undefined) {
        const parsedAmount = parsePositiveMoney(amount);
        if (parsedAmount === 'INVALID_AMOUNT') {
          return res.status(400).json({error: 'INVALID_AMOUNT'});
        }
        const updated = await updateExpense(expenseId, {amount: parsedAmount});
        await createAuditLog({
          action: 'EXPENSE_UPDATED',
          entityType: 'EXPENSE',
          entityId: updated.id,
          periodId: existing.periodId,
          buildingId: existing.buildingId,
          actorUserId: req.user.id,
          metadata: {amount: updated.amount},
        });
        return res.json(updated);
      }

      const updated = await updateExpense(expenseId, {});
      await createAuditLog({
        action: 'EXPENSE_UPDATED',
        entityType: 'EXPENSE',
        entityId: updated.id,
        periodId: existing.periodId,
        buildingId: existing.buildingId,
        actorUserId: req.user.id,
        metadata: {amount: updated.amount},
      });
      return res.json(updated);
    } catch (err) {
      return sendMoneyError(err, res, next);
    }
  },
);

// DELETE /expenses/:id
expenseRouter.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const expenseId = req.params.id as string;

      const existing = await import('../prismaClient.js').then(m =>
        m.prisma.expense.findUnique({where: {id: expenseId}}),
      );
      if (!existing) return res.status(404).json({error: 'EXPENSE_NOT_FOUND'});

      if (!hasRoleForBuilding(user, existing.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      await deleteExpense(expenseId);
      await createAuditLog({
        action: 'EXPENSE_DELETED',
        entityType: 'EXPENSE',
        entityId: expenseId,
        periodId: existing.periodId,
        buildingId: existing.buildingId,
        actorUserId: req.user.id,
        metadata: {unitId: existing.unitId},
      });
      return res.status(204).send();
    } catch (err) {
      return sendMoneyError(err, res, next);
    }
  },
);

// POST /expenses/:id/payments
expenseRouter.post(
  '/:id/payments',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const expenseId = req.params.id as string;

      const {amount, paymentMethod, externalPaymentId} = req.body as {
        amount?: unknown;
        paymentMethod?: string;
        externalPaymentId?: string;
      };

      const created = await createPayment({
        actor: toExpenseActor(user),
        expenseId,
        amount,
        ...(paymentMethod !== undefined && {paymentMethod}),
        ...(externalPaymentId !== undefined && {externalPaymentId}),
      });
      await createAuditLog({
        action: 'PAYMENT_CREATED',
        entityType: 'PAYMENT',
        entityId: created.payment.id,
        periodId: created.periodId,
        buildingId: created.buildingId,
        actorUserId: req.user.id,
        metadata: {
          expenseId,
          amount: created.payment.amount,
          paymentMethod: paymentMethod ?? null,
          externalPaymentId: externalPaymentId ?? null,
        },
      });
      return res.status(201).json(created.payment);
    } catch (err) {
      return sendMoneyError(err, res, next);
    }
  },
);

// ─── Standalone payment routes (/payments/:id) ────────────────────────────────

export const paymentRouter = Router();

// PUT /payments/:id
paymentRouter.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const paymentId = req.params.id as string;

      const existing = await import('../prismaClient.js').then(m =>
        m.prisma.payment.findUnique({
          where: {id: paymentId},
          include: {
            expense: {
              select: {periodId: true},
            },
          },
        }),
      );
      if (!existing) return res.status(404).json({error: 'PAYMENT_NOT_FOUND'});

      if (!hasRoleForBuilding(user, existing.buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const status = req.body?.status as string | undefined;
      const allowedStatuses = ['COMPLETED', 'REJECTED'] as const;
      if (
        !status ||
        !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
      ) {
        return res.status(400).json({error: 'INVALID_STATUS'});
      }

      const updated = await updatePayment(
        paymentId,
        status as 'COMPLETED' | 'REJECTED',
      );
      await createAuditLog({
        action: 'PAYMENT_UPDATED',
        entityType: 'PAYMENT',
        entityId: updated.id,
        periodId: existing.expense.periodId,
        buildingId: existing.buildingId,
        actorUserId: req.user.id,
        metadata: {status: updated.status},
      });
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  },
);
