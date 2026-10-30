import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {expenseAmountBlock, expenseWriteBlock} from './expenseRules.js';

describe('expenseWriteBlock', () => {
  it('allows an open unpaid line and blocks a closed period or a paid line', () => {
    assert.equal(expenseWriteBlock({periodStatus: 'OPEN', expenseStatus: 'UNPAID'}), null);
    assert.equal(expenseWriteBlock({periodStatus: 'CLOSED'}), 'PERIOD_CLOSED');
    assert.equal(
      expenseWriteBlock({periodStatus: 'OPEN', expenseStatus: 'PAID'}),
      'EXPENSE_ALREADY_PAID',
    );
  });
});

describe('expenseAmountBlock', () => {
  it('locks the amount while a payment is pending or completed', () => {
    assert.equal(expenseAmountBlock([]), null);
    assert.equal(expenseAmountBlock([{status: 'REJECTED'}]), null);
    assert.equal(expenseAmountBlock([{status: 'FAILED'}]), null);
    assert.equal(
      expenseAmountBlock([{status: 'PENDING'}]),
      'EXPENSE_HAS_PAYMENTS',
    );
    assert.equal(
      expenseAmountBlock([{status: 'COMPLETED'}]),
      'EXPENSE_HAS_PAYMENTS',
    );
  });
});
