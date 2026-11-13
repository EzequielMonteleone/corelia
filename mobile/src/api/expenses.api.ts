import {apiClient} from '@/api/client';
import type {
  AuditLog,
  CollectionSummary,
  Expense,
  ExpensePeriod,
  ExpensePeriodDetail,
  ExpensePeriodStatus,
  Payment,
  PaymentStatus,
} from '@/types/expense';

export async function listExpensePeriods(
  buildingId: string,
): Promise<ExpensePeriod[]> {
  const {data} = await apiClient.get<ExpensePeriod[]>(
    `/buildings/${buildingId}/expense-periods`,
  );
  return data;
}

export async function getCollectionSummary(
  buildingId: string,
): Promise<CollectionSummary> {
  const {data} = await apiClient.get<CollectionSummary>(
    `/buildings/${buildingId}/expense-periods/summary`,
  );
  return data;
}

export async function createExpensePeriod(input: {
  buildingId: string;
  period: string;
}): Promise<ExpensePeriod> {
  const {data} = await apiClient.post<ExpensePeriod>(
    `/buildings/${input.buildingId}/expense-periods`,
    {period: input.period},
  );
  return data;
}

export async function deleteExpensePeriod(periodId: string): Promise<void> {
  await apiClient.delete(`/expense-periods/${periodId}`);
}

export async function getExpensePeriod(
  periodId: string,
): Promise<ExpensePeriodDetail> {
  const {data} = await apiClient.get<ExpensePeriodDetail>(
    `/expense-periods/${periodId}`,
  );
  return data;
}

export async function getExpensePeriodAuditLogs(
  periodId: string,
): Promise<AuditLog[]> {
  const {data} = await apiClient.get<AuditLog[]>(
    `/expense-periods/${periodId}/audit-logs`,
  );
  return data;
}

export async function updateExpensePeriodStatus(
  periodId: string,
  status: ExpensePeriodStatus,
): Promise<ExpensePeriod> {
  const {data} = await apiClient.put<ExpensePeriod>(
    `/expense-periods/${periodId}`,
    {status},
  );
  return data;
}

export async function createExpense(input: {
  periodId: string;
  unitId: string;
  amount: number;
}): Promise<Expense> {
  const {data} = await apiClient.post<Expense>(
    `/expense-periods/${input.periodId}/expenses`,
    {unitId: input.unitId, amount: input.amount},
  );
  return data;
}

export async function updateExpense(input: {
  expenseId: string;
  amount: number;
}): Promise<Expense> {
  const {data} = await apiClient.put<Expense>(`/expenses/${input.expenseId}`, {
    amount: input.amount,
  });
  return data;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await apiClient.delete(`/expenses/${expenseId}`);
}

export async function createPayment(input: {
  expenseId: string;
  amount: number;
  paymentMethod?: string;
  externalPaymentId?: string;
}): Promise<Payment> {
  const {data} = await apiClient.post<Payment>(
    `/expenses/${input.expenseId}/payments`,
    {
      amount: input.amount,
      ...(input.paymentMethod ? {paymentMethod: input.paymentMethod} : {}),
      ...(input.externalPaymentId
        ? {externalPaymentId: input.externalPaymentId}
        : {}),
    },
  );
  return data;
}

export async function updatePaymentStatus(input: {
  paymentId: string;
  status: Extract<PaymentStatus, 'COMPLETED' | 'REJECTED'>;
}): Promise<Payment> {
  const {data} = await apiClient.put<Payment>(`/payments/${input.paymentId}`, {
    status: input.status,
  });
  return data;
}
