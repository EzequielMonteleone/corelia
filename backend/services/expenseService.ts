import {prisma} from '../prismaClient.js';
import {
  ExpensePeriodStatus,
  ExpenseStatus,
  PaymentStatus,
} from '@prisma/client';

export async function getExpensePeriods(buildingId: string) {
  return prisma.expensePeriod.findMany({
    where: {buildingId},
    orderBy: {generatedAt: 'desc'},
    include: {
      _count: {select: {expenses: true}},
    },
  });
}

export async function createExpensePeriod(buildingId: string, period: string) {
  return prisma.expensePeriod.create({
    data: {buildingId, period},
    include: {
      _count: {select: {expenses: true}},
    },
  });
}

export async function getExpensePeriodDetail(periodId: string) {
  return prisma.expensePeriod.findUnique({
    where: {id: periodId},
    include: {
      building: {select: {id: true, name: true}},
      expenses: {
        include: {
          unit: {select: {id: true, name: true, floor: true}},
          payments: {
            orderBy: {createdAt: 'asc'},
          },
        },
        orderBy: [{unit: {floor: 'asc'}}, {unit: {name: 'asc'}}],
      },
    },
  });
}

export async function updateExpensePeriod(
  periodId: string,
  status: ExpensePeriodStatus,
) {
  return prisma.expensePeriod.update({
    where: {id: periodId},
    data: {status},
  });
}

export async function deleteExpensePeriod(periodId: string) {
  return prisma.expensePeriod.delete({
    where: {id: periodId},
  });
}

export async function createExpense(data: {
  buildingId: string;
  unitId: string;
  periodId: string;
  amount: number;
}) {
  return prisma.expense.create({
    data: {
      buildingId: data.buildingId,
      unitId: data.unitId,
      periodId: data.periodId,
      amount: data.amount,
    },
    include: {
      unit: {select: {id: true, name: true, floor: true}},
      payments: true,
    },
  });
}

export async function updateExpense(
  id: string,
  data: {amount?: number; status?: ExpenseStatus},
) {
  return prisma.expense.update({
    where: {id},
    data,
    include: {
      unit: {select: {id: true, name: true, floor: true}},
      payments: true,
    },
  });
}

export async function deleteExpense(id: string) {
  return prisma.expense.delete({where: {id}});
}

export async function createPayment(data: {
  buildingId: string;
  expenseId: string;
  amount: number;
  paymentMethod?: string;
  externalPaymentId?: string;
}) {
  const payment = await prisma.payment.create({
    data: {
      buildingId: data.buildingId,
      expenseId: data.expenseId,
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? null,
      externalPaymentId: data.externalPaymentId ?? null,
      status: PaymentStatus.PENDING,
      paidAt: null,
    },
  });

  await recalculateExpenseStatus(data.expenseId);

  return payment;
}

const PAYMENT_COMPLETED = 'COMPLETED' as const;
const PAYMENT_REJECTED = 'REJECTED' as const;
const PAYMENT_PENDING = 'PENDING' as const;

export async function updatePayment(
  id: string,
  status: typeof PAYMENT_COMPLETED | typeof PAYMENT_REJECTED,
) {
  const payment = await prisma.payment.update({
    where: {id},
    data: {
      status,
      paidAt: status === PAYMENT_COMPLETED ? new Date() : null,
    },
  });

  await recalculateExpenseStatus(payment.expenseId);

  return payment;
}

async function recalculateExpenseStatus(expenseId: string) {
  const expense = await prisma.expense.findUnique({
    where: {id: expenseId},
    include: {
      payments: true,
    },
  });

  if (!expense) return;

  const totalApproved = expense.payments
    .filter(p => p.status === PAYMENT_COMPLETED)
    .reduce((sum, p) => sum + p.amount, 0);
  const hasPendingPayment = expense.payments.some(
    p => p.status === PAYMENT_PENDING,
  );

  let newStatus: ExpenseStatus;
  if (totalApproved >= expense.amount) {
    newStatus = ExpenseStatus.PAID;
  } else if (hasPendingPayment) {
    newStatus = ExpenseStatus.PENDING;
  } else {
    newStatus = ExpenseStatus.UNPAID;
  }

  await prisma.expense.update({
    where: {id: expenseId},
    data: {status: newStatus},
  });
}
