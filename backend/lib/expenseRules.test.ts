import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {expenseWriteBlock} from './expenseRules.js';

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
