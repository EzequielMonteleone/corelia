import {prisma} from '../prismaClient.js';
import {
  ExpensePeriodStatus,
  ExpenseStatus,
  PaymentStatus,
} from '@prisma/client';
import {
  exceedsBalance,
  moneyCents,
  openBalance,
  paidAmount,
  parsePositiveMoney,
  reservedAmount,
  roundMoney,
  toMoneyNumber,
} from '../lib/money.js';
import {expenseWriteBlock} from '../lib/expenseRules.js';

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
  const period = await prisma.expensePeriod.findUnique({
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
  if (!period) return null;
  return {
    ...period,
    expenses: period.expenses.map(presentExpense),
  };
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
  const amount = parsePositiveMoney(data.amount);
  if (amount === 'INVALID_AMOUNT') throw new Error('INVALID_AMOUNT');

  const period = await prisma.expensePeriod.findFirst({
    where: {id: data.periodId, buildingId: data.buildingId},
    select: {status: true},
  });
  if (!period) throw new Error('EXPENSE_PERIOD_NOT_FOUND');
  const block = expenseWriteBlock({periodStatus: period.status});
  if (block) throw new Error(block);

  const unit = await prisma.unit.findFirst({
    where: {id: data.unitId, buildingId: data.buildingId},
    select: {id: true},
  });
  if (!unit) throw new Error('UNIT_NOT_IN_BUILDING');

  const expense = await prisma.expense.create({
    data: {
      buildingId: data.buildingId,
      unitId: data.unitId,
      periodId: data.periodId,
      amount,
    },
    include: {
      unit: {select: {id: true, name: true, floor: true}},
      payments: true,
    },
  });
  return presentExpense(expense);
}

async function assertExpenseWritable(id: string) {
  const current = await prisma.expense.findUnique({
    where: {id},
    include: {period: {select: {status: true}}},
  });
  if (!current) throw new Error('EXPENSE_NOT_FOUND');
  const block = expenseWriteBlock({
    periodStatus: current.period.status,
    expenseStatus: current.status,
  });
  if (block) throw new Error(block);
  return current;
}

export async function updateExpense(
  id: string,
  data: {amount?: number; status?: ExpenseStatus},
) {
  await assertExpenseWritable(id);
  const updateData: {amount?: number; status?: ExpenseStatus} = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.amount !== undefined) {
    const amount = parsePositiveMoney(data.amount);
    if (amount === 'INVALID_AMOUNT') throw new Error('INVALID_AMOUNT');
    updateData.amount = amount;
  }

  const expense = await prisma.expense.update({
    where: {id},
    data: updateData,
    include: {
      unit: {select: {id: true, name: true, floor: true}},
      payments: true,
    },
  });
  return presentExpense(expense);
}

export async function deleteExpense(id: string) {
  await assertExpenseWritable(id);
  return prisma.expense.delete({where: {id}});
}

export async function createPayment(data: {
  buildingId: string;
  expenseId: string;
  amount: number;
  paymentMethod?: string;
  externalPaymentId?: string;
}) {
  const amount = parsePositiveMoney(data.amount);
  if (amount === 'INVALID_AMOUNT') throw new Error('INVALID_AMOUNT');

  const expense = await prisma.expense.findUnique({
    where: {id: data.expenseId},
    include: {payments: true},
  });
  if (!expense) throw new Error('EXPENSE_NOT_FOUND');

  const reserved = reservedAmount(expense.payments);
  const remaining = roundMoney(
    Math.max(toMoneyNumber(expense.amount) - reserved, 0),
  );
  if (exceedsBalance(amount, remaining)) {
    throw new Error('AMOUNT_EXCEEDS_BALANCE');
  }

  const payment = await prisma.payment.create({
    data: {
      buildingId: data.buildingId,
      expenseId: data.expenseId,
      amount,
      paymentMethod: data.paymentMethod ?? null,
      externalPaymentId: data.externalPaymentId ?? null,
      status: PaymentStatus.PENDING,
      paidAt: null,
    },
  });

  await recalculateExpenseStatus(data.expenseId);

  return presentPayment(payment);
}

function presentPayment<T extends {amount: unknown}>(payment: T) {
  return {...payment, amount: toMoneyNumber(payment.amount)};
}

function presentExpense<
  T extends {amount: unknown; payments?: {amount: unknown; status: string}[]},
>(expense: T) {
  return {
    ...expense,
    amount: toMoneyNumber(expense.amount),
    ...(expense.payments
      ? {
          payments: expense.payments.map(payment => presentPayment(payment)),
          remaining: openBalance(expense.amount, expense.payments),
        }
      : {remaining: openBalance(expense.amount, [])}),
  };
}

export async function getBuildingCollectionSummary(buildingId: string) {
  const expenses = await prisma.expense.findMany({
    where: {buildingId},
    select: {
      id: true,
      unitId: true,
      amount: true,
      status: true,
      payments: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
  });

  const totalInvoiced = roundMoney(
    expenses.reduce((sum, expense) => sum + toMoneyNumber(expense.amount), 0),
  );

  let totalPaid = 0;
  let debtTotal = 0;
  const unitsWithDebt = new Set<string>();

  for (const expense of expenses) {
    const approvedAmount = paidAmount(expense.payments);
    totalPaid = roundMoney(totalPaid + approvedAmount);

    const remaining = roundMoney(
      Math.max(toMoneyNumber(expense.amount) - approvedAmount, 0),
    );
    if (remaining > 0) {
      debtTotal = roundMoney(debtTotal + remaining);
      unitsWithDebt.add(expense.unitId);
    }
  }

  const collectionRate =
    totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

  return {
    buildingId,
    totalInvoiced,
    totalPaid,
    debtTotal,
    collectionRate,
    unitsWithDebtCount: unitsWithDebt.size,
    expensesCount: expenses.length,
  };
}

type ExportExpenseRow = {
  unit: string;
  floor: string;
  amount: number;
  status: ExpenseStatus;
  paid: number;
  remaining: number;
};

export async function getExpensePeriodExportData(
  periodId: string,
  unitIds: string[] | null,
) {
  const period = await getExpensePeriodDetail(periodId);
  if (!period) return null;

  const visible =
    unitIds === null
      ? period.expenses
      : period.expenses.filter(expense => unitIds.includes(expense.unitId));

  const rows: ExportExpenseRow[] = visible.map(expense => {
    const paid = paidAmount(expense.payments);

    return {
      unit: expense.unit.name,
      floor: expense.unit.floor ?? '-',
      amount: expense.amount,
      status: expense.status,
      paid,
      remaining: roundMoney(Math.max(expense.amount - paid, 0)),
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      amount: roundMoney(acc.amount + row.amount),
      paid: roundMoney(acc.paid + row.paid),
      remaining: roundMoney(acc.remaining + row.remaining),
    }),
    {amount: 0, paid: 0, remaining: 0},
  );

  return {
    period,
    rows,
    totals,
  };
}

export async function buildExpensePeriodCsv(
  periodId: string,
  unitIds: string[] | null,
) {
  const exportData = await getExpensePeriodExportData(periodId, unitIds);
  if (!exportData) return null;

  const {period, rows, totals} = exportData;

  const escapeCsv = (value: string | number) => {
    const raw = String(value);
    if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const lines = [
    ['Building', period.building.name],
    ['Period', period.period],
    ['GeneratedAt', period.generatedAt.toISOString()],
    [],
    ['Unit', 'Floor', 'Amount', 'Status', 'Paid', 'Remaining'],
    ...rows.map(row => [
      row.unit,
      row.floor,
      row.amount.toFixed(2),
      row.status,
      row.paid.toFixed(2),
      row.remaining.toFixed(2),
    ]),
    [],
    [
      'TOTAL',
      '',
      totals.amount.toFixed(2),
      '',
      totals.paid.toFixed(2),
      totals.remaining.toFixed(2),
    ],
  ];

  return lines
    .map(row => row.map(cell => escapeCsv(cell)).join(','))
    .join('\n');
}

export async function buildExpensePeriodPdf(
  periodId: string,
  unitIds: string[] | null,
) {
  const exportData = await getExpensePeriodExportData(periodId, unitIds);
  if (!exportData) return null;

  const {period, rows, totals} = exportData;

  const lines: string[] = [
    `Corelia - Expense Report`,
    `Building: ${period.building.name}`,
    `Period: ${period.period}`,
    `Generated: ${period.generatedAt.toISOString()}`,
    '',
    'Unit | Floor | Amount | Status | Paid | Remaining',
    ...rows.map(
      row =>
        `${row.unit} | ${row.floor} | ${row.amount.toFixed(2)} | ${row.status} | ${row.paid.toFixed(2)} | ${row.remaining.toFixed(2)}`,
    ),
    '',
    `Totals -> Amount: ${totals.amount.toFixed(2)} | Paid: ${totals.paid.toFixed(2)} | Remaining: ${totals.remaining.toFixed(2)}`,
  ];

  return createBasicPdfBuffer(lines);
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

  return presentPayment(payment);
}

async function recalculateExpenseStatus(expenseId: string) {
  const expense = await prisma.expense.findUnique({
    where: {id: expenseId},
    include: {
      payments: true,
    },
  });

  if (!expense) return;

  const totalApproved = paidAmount(expense.payments);
  const hasPendingPayment = expense.payments.some(
    p => p.status === PAYMENT_PENDING,
  );

  let newStatus: ExpenseStatus;
  if (moneyCents(totalApproved) >= moneyCents(toMoneyNumber(expense.amount))) {
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

function createBasicPdfBuffer(lines: string[]) {
  const sanitizedLines = lines.slice(0, 120).map(line => line.slice(0, 140));
  const escaped = sanitizedLines.map(line =>
    line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'),
  );

  let textCommands = 'BT\n/F1 10 Tf\n40 800 Td\n14 TL\n';
  for (const line of escaped) {
    textCommands += `(${line}) Tj\nT*\n`;
  }
  textCommands += 'ET';

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(textCommands, 'utf8')} >>\nstream\n${textCommands}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}
