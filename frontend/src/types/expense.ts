export type ExpensePeriodStatus = 'OPEN' | 'CLOSED';
export type ExpenseStatus = 'UNPAID' | 'PENDING' | 'PAID';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED';

export interface Payment {
  id: string;
  buildingId: string;
  expenseId: string;
  amount: number;
  paymentMethod: string | null;
  externalPaymentId: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  buildingId: string;
  unitId: string;
  periodId: string;
  amount: number;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  unit: {
    id: string;
    name: string;
    floor: string | null;
  };
  payments: Payment[];
}

export interface ExpensePeriod {
  id: string;
  buildingId: string;
  period: string;
  generatedAt: string;
  status: ExpensePeriodStatus;
  _count?: {expenses: number};
}

export interface ExpensePeriodDetail extends Omit<ExpensePeriod, '_count'> {
  building: {id: string; name: string};
  expenses: Expense[];
}

export interface CollectionSummary {
  buildingId: string;
  totalInvoiced: number;
  totalPaid: number;
  debtTotal: number;
  collectionRate: number;
  unitsWithDebtCount: number;
  expensesCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  periodId: string | null;
  buildingId: string;
  actorUserId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
