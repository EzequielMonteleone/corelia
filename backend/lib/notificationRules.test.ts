import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  claimUpdateNotice,
  clipNotificationTitle,
  documentNotice,
  withoutActor,
} from './notificationRules.js';

const previous = {
  authorUserId: 'author-1',
  status: 'OPEN' as const,
  reply: null,
};

describe('claimUpdateNotice', () => {
  it('skips when the status and the reply stay the same', () => {
    assert.equal(
      claimUpdateNotice(previous, {status: 'OPEN'}, 'admin-1'),
      null,
    );
    assert.equal(
      claimUpdateNotice({...previous, reply: 'Listo'}, {reply: 'Listo'}, 'admin-1'),
      null,
    );
  });

  it('skips when the actor is the author', () => {
    assert.equal(
      claimUpdateNotice(previous, {status: 'CLOSED'}, 'author-1'),
      null,
    );
  });

  it('notifies the author when the status changes', () => {
    assert.deepEqual(
      claimUpdateNotice(previous, {status: 'IN_PROGRESS'}, 'admin-1'),
      {kind: 'CLAIM_UPDATED', claimStatus: 'IN_PROGRESS'},
    );
  });

  it('notifies on a reply and keeps the current status', () => {
    assert.deepEqual(
      claimUpdateNotice(
        {...previous, status: 'IN_PROGRESS'},
        {reply: 'Lo vemos mañana'},
        'admin-1',
      ),
      {kind: 'CLAIM_UPDATED', claimStatus: 'IN_PROGRESS'},
    );
  });
});

describe('documentNotice', () => {
  it('maps a bylaw and a notice', () => {
    assert.equal(documentNotice('BYLAW'), 'BYLAW_PUBLISHED');
    assert.equal(documentNotice('NOTICE'), 'NOTICE_PUBLISHED');
  });
});

describe('clipNotificationTitle', () => {
  it('trims and caps the title at 120 characters', () => {
    assert.equal(clipNotificationTitle('  Reglamento  '), 'Reglamento');
    assert.equal(clipNotificationTitle('a'.repeat(121)).length, 120);
  });
});

describe('withoutActor', () => {
  it('drops the person who just wrote', () => {
    assert.deepEqual(withoutActor(['admin-1', 'owner-1', 'admin-1'], 'admin-1'), [
      'owner-1',
    ]);
  });
});
