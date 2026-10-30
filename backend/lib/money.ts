export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function moneyCents(value: number): number {
  return Math.round(value * 100);
}

/** Finite and greater than zero, rounded to cents. */
export function parsePositiveMoney(value: unknown): number | 'INVALID_AMOUNT' {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'INVALID_AMOUNT';
  const rounded = roundMoney(value);
  if (rounded <= 0) return 'INVALID_AMOUNT';
  return rounded;
}

export function toMoneyNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? roundMoney(value) : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    'toString' in value &&
    typeof value.toString === 'function'
  ) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
  }
  return 0;
}

export function exceedsBalance(amount: number, remaining: number): boolean {
  return moneyCents(amount) > moneyCents(remaining);
}

/** Approving this payment would push the completed total past the expense. */
export function approvalExceedsAmount(
  expenseAmount: unknown,
  payments: {id: string; amount: unknown; status: string}[],
  paymentId: string,
): boolean {
  const projected = payments.map(payment =>
    payment.id === paymentId ? {...payment, status: 'COMPLETED'} : payment,
  );
  return (
    moneyCents(paidAmount(projected)) > moneyCents(toMoneyNumber(expenseAmount))
  );
}

const RESERVED_PAYMENT_STATUSES = new Set(['COMPLETED', 'PENDING']);

/** Payments already approved. Pending payments are not collected yet. */
export function paidAmount(
  payments: {amount: unknown; status: string}[],
): number {
  return roundMoney(
    payments
      .filter(payment => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + toMoneyNumber(payment.amount), 0),
  );
}

/** What can still be charged. Completed and pending payments hold the balance. */
export function openBalance(
  amount: unknown,
  payments: {amount: unknown; status: string}[],
): number {
  const remaining = roundMoney(toMoneyNumber(amount) - reservedAmount(payments));
  return remaining > 0 ? remaining : 0;
}

/** Completed and pending payments hold the balance. Rejected and failed do not. */
export function reservedAmount(
  payments: {amount: unknown; status: string}[],
): number {
  return roundMoney(
    payments
      .filter(payment => RESERVED_PAYMENT_STATUSES.has(payment.status))
      .reduce((sum, payment) => sum + toMoneyNumber(payment.amount), 0),
  );
}
