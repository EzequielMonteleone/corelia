export type ExpenseWriteBlock = 'PERIOD_CLOSED' | 'EXPENSE_ALREADY_PAID' | null;

const AMOUNT_LOCKING_STATUSES = new Set(['PENDING', 'COMPLETED']);

/** A line can be created, edited, or deleted only while its period is open and it is not paid. */
export function expenseWriteBlock(input: {
  periodStatus: string;
  expenseStatus?: string | null;
}): ExpenseWriteBlock {
  if (input.periodStatus !== 'OPEN') return 'PERIOD_CLOSED';
  if (input.expenseStatus === 'PAID') return 'EXPENSE_ALREADY_PAID';
  return null;
}

/** The amount stays put once a payment is pending or approved. */
export function expenseAmountBlock(
  payments: {status: string}[],
): 'EXPENSE_HAS_PAYMENTS' | null {
  if (payments.some(payment => AMOUNT_LOCKING_STATUSES.has(payment.status))) {
    return 'EXPENSE_HAS_PAYMENTS';
  }
  return null;
}
