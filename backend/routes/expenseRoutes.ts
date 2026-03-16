import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {findUserById} from '../services/userService.js';
import {GlobalRole, ExpensePeriodStatus} from '@prisma/client';
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
} from '../services/expenseService.js';

function hasRoleForBuilding(
  user: {
    globalRole: GlobalRole;
    buildingUsers: {buildingId: string; role: {name: string}}[];
  },
  buildingId: string,
  allowedRoles: string[],
) {
  if (user.globalRole === GlobalRole.SUPERADMIN) return true;
  return user.buildingUsers.some(
    bu => bu.buildingId === buildingId && allowedRoles.includes(bu.role.name),
  );
}

function getBuildingRole(
  user: {buildingUsers: {buildingId: string; role: {name: string}}[]},
  buildingId: string,
): string | null {
  const bu = user.buildingUsers.find(bu => bu.buildingId === buildingId);
  return bu?.role?.name ?? null;
}

function getUnitIdsForBuilding(
  user: {
    userUnits?: {unitId: string; unit: {buildingId: string}}[];
  },
  buildingId: string,
): string[] {
  if (!user.userUnits) return [];
  return user.userUnits
    .filter(uu => uu.unit.buildingId === buildingId)
    .map(uu => uu.unitId);
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

      if (!hasRoleForBuilding(user, buildingId, ['Admin', 'Owner', 'Roomer'])) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const periods = await getExpensePeriods(buildingId);
      return res.json(periods);
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

      if (!hasRoleForBuilding(user, buildingId, ['Admin'])) {
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

      if (
        !hasRoleForBuilding(user, detail.buildingId, [
          'Admin',
          'Owner',
          'Roomer',
        ])
      ) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const buildingRole = getBuildingRole(user, detail.buildingId);
      const isAdminOrSuperadmin =
        user.globalRole === GlobalRole.SUPERADMIN || buildingRole === 'Admin';

      if (!isAdminOrSuperadmin && (buildingRole === 'Owner' || buildingRole === 'Roomer')) {
        const unitIds = getUnitIdsForBuilding(user, detail.buildingId);
        const filteredExpenses = detail.expenses.filter(e =>
          unitIds.includes(e.unitId),
        );
        return res.json({
          ...detail,
          expenses: filteredExpenses,
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

      if (!hasRoleForBuilding(user, detail.buildingId, ['Admin'])) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const status = req.body?.status as ExpensePeriodStatus | undefined;
      if (!status || !Object.values(ExpensePeriodStatus).includes(status)) {
        return res.status(400).json({error: 'INVALID_STATUS'});
      }

      const updated = await updateExpensePeriod(periodId, status);
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

      if (!hasRoleForBuilding(user, detail.buildingId, ['Admin'])) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      await deleteExpensePeriod(periodId);
      return res.status(204).send();
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

      if (!hasRoleForBuilding(user, detail.buildingId, ['Admin'])) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const unitId = req.body?.unitId as string | undefined;
      const amount = req.body?.amount as number | undefined;

      if (!unitId) return res.status(400).json({error: 'UNIT_ID_REQUIRED'});
      if (
        amount === undefined ||
        amount === null ||
        typeof amount !== 'number'
      ) {
        return res.status(400).json({error: 'AMOUNT_REQUIRED'});
      }

      const expense = await createExpense({
        buildingId: detail.buildingId,
        unitId,
        periodId,
        amount,
      });
      return res.status(201).json(expense);
    } catch (err) {
      return next(err);
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

      if (!hasRoleForBuilding(user, existing.buildingId, ['Admin'])) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const {amount} = req.body as {amount?: number};
      const updated = await updateExpense(expenseId, {
        ...(typeof amount === 'number' ? {amount} : {}),
      });
      return res.json(updated);
    } catch (err) {
      return next(err);
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

      if (!hasRoleForBuilding(user, existing.buildingId, ['Admin'])) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      await deleteExpense(expenseId);
      return res.status(204).send();
    } catch (err) {
      return next(err);
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

      const existing = await import('../prismaClient.js').then(m =>
        m.prisma.expense.findUnique({where: {id: expenseId}}),
      );
      if (!existing) return res.status(404).json({error: 'EXPENSE_NOT_FOUND'});

      if (
        !hasRoleForBuilding(user, existing.buildingId, [
          'Admin',
          'Owner',
          'Roomer',
        ])
      ) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const buildingRole = getBuildingRole(user, existing.buildingId);
      const isAdminOrSuperadmin =
        user.globalRole === GlobalRole.SUPERADMIN || buildingRole === 'Admin';
      if (!isAdminOrSuperadmin && (buildingRole === 'Owner' || buildingRole === 'Roomer')) {
        const unitIds = getUnitIdsForBuilding(user, existing.buildingId);
        if (!unitIds.includes(existing.unitId)) {
          return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
        }
      }

      const {amount, paymentMethod, externalPaymentId} = req.body as {
        amount?: number;
        paymentMethod?: string;
        externalPaymentId?: string;
      };

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({error: 'INVALID_AMOUNT'});
      }

      const payment = await createPayment({
        buildingId: existing.buildingId,
        expenseId,
        amount,
        ...(paymentMethod !== undefined && {paymentMethod}),
        ...(externalPaymentId !== undefined && {externalPaymentId}),
      });
      return res.status(201).json(payment);
    } catch (err) {
      return next(err);
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
        m.prisma.payment.findUnique({where: {id: paymentId}}),
      );
      if (!existing) return res.status(404).json({error: 'PAYMENT_NOT_FOUND'});

      if (!hasRoleForBuilding(user, existing.buildingId, ['Admin'])) {
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

      const updated = await updatePayment(paymentId, status as 'COMPLETED' | 'REJECTED');
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  },
);
