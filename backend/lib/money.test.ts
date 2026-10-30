import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  approvalExceedsAmount,
  exceedsBalance,
  parsePositiveMoney,
  reservedAmount,
  roundMoney,
  toMoneyNumber,
} from './money.js';

describe('parsePositiveMoney', () => {
  it('rounds a positive finite amount to cents', () => {
    assert.equal(parsePositiveMoney(10.126), 10.13);
    assert.equal(parsePositiveMoney(1), 1);
  });

  it('rejects zero, negatives, and non-finite numbers', () => {
    assert.equal(parsePositiveMoney(0), 'INVALID_AMOUNT');
    assert.equal(parsePositiveMoney(-4), 'INVALID_AMOUNT');
    assert.equal(parsePositiveMoney(Number.NaN), 'INVALID_AMOUNT');
    assert.equal(parsePositiveMoney(Number.POSITIVE_INFINITY), 'INVALID_AMOUNT');
    assert.equal(parsePositiveMoney('10'), 'INVALID_AMOUNT');
  });

  it('rejects a value that rounds down to zero', () => {
    assert.equal(parsePositiveMoney(0.001), 'INVALID_AMOUNT');
  });
});

describe('toMoneyNumber', () => {
  it('reads numbers and decimal-like values', () => {
    assert.equal(toMoneyNumber(12.345), 12.35);
    assert.equal(toMoneyNumber({toString: () => '8.1'}), 8.1);
    assert.equal(roundMoney(0.1 + 0.2), 0.3);
  });
});

describe('reservedAmount', () => {
  it('sums completed and pending payments and ignores the rest', () => {
    assert.equal(
      reservedAmount([
        {amount: 10, status: 'COMPLETED'},
        {amount: 5.126, status: 'PENDING'},
        {amount: 7, status: 'REJECTED'},
        {amount: 3, status: 'FAILED'},
      ]),
      15.13,
    );
  });
});

describe('exceedsBalance', () => {
  it('compares in cents', () => {
    assert.equal(exceedsBalance(10, 10), false);
    assert.equal(exceedsBalance(9.99, 10), false);
    assert.equal(exceedsBalance(10.01, 10), true);
  });
});

describe('approvalExceedsAmount', () => {
  const expense = 100;
  const pending = {id: 'pay-1', amount: 100, status: 'PENDING'};

  it('allows an approval that lands on the expense amount', () => {
    assert.equal(approvalExceedsAmount(expense, [pending], pending.id), false);
  });

  it('rejects an approval that would stack on money already completed', () => {
    assert.equal(
      approvalExceedsAmount(
        expense,
        [pending, {id: 'pay-2', amount: 100, status: 'COMPLETED'}],
        pending.id,
      ),
      true,
    );
  });

  it('ignores rejected payments', () => {
    assert.equal(
      approvalExceedsAmount(
        expense,
        [pending, {id: 'pay-2', amount: 100, status: 'REJECTED'}],
        pending.id,
      ),
      false,
    );
  });
});
