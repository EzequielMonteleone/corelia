export type ExpenseWriteBlock = 'PERIOD_CLOSED' | 'EXPENSE_ALREADY_PAID' | null;

/** A line can be created, edited, or deleted only while its period is open and it is not paid. */
export function expenseWriteBlock(input: {
  periodStatus: string;
  expenseStatus?: string | null;
}): ExpenseWriteBlock {
  if (input.periodStatus !== 'OPEN') return 'PERIOD_CLOSED';
  if (input.expenseStatus === 'PAID') return 'EXPENSE_ALREADY_PAID';
  return null;
}
