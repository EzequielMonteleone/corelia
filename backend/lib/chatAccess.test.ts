import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  canSearchBuildingDocs,
  confirmReservationDraft,
  expenseStandingForActor,
  expensesForActor,
  myReservationScope,
  toolsForActor,
  type ChatActor,
  type ExpenseView,
  type StandingUnit,
} from './chatAccess.js';

const torre = 'building-torre';
const otro = 'building-otro';

const standing: StandingUnit[] = [
  {unitId: 'u1', unitName: '1A', status: 'CURRENT', balance: 0},
  {unitId: 'u2', unitName: '2A', status: 'IN_DEBT', balance: 15000},
];

const expenses: ExpenseView[] = [
  {
    unitId: 'u1',
    unitName: '1A',
    period: '2026-10',
    amount: 10000,
    status: 'PAID',
    balance: 0,
  },
  {
    unitId: 'u2',
    unitName: '2A',
    period: '2026-10',
    amount: 20000,
    status: 'UNPAID',
    balance: 15000,
  },
];

function owner(): ChatActor {
  return {
    userId: 'owner-1',
    firstName: 'Lucía',
    lastName: 'Fernández',
    globalRole: 'USER',
    buildings: [{id: torre, name: 'Torre Palermo', role: 'Owner'}],
    units: [{id: 'u1', name: '1A', buildingId: torre, relationType: 'OWNER'}],
  };
}

function admin(): ChatActor {
  return {
    userId: 'admin-1',
    firstName: 'Ana',
    lastName: 'Admin',
    globalRole: 'USER',
    buildings: [{id: torre, name: 'Torre Palermo', role: 'Admin'}],
    units: [],
  };
}

describe('expense standing permissions', () => {
  it('does not return other units when an owner asks who owes', () => {
    const result = expenseStandingForActor(owner(), torre, standing);
    assert.equal(result.ok, false);
    if (result.ok) return;
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes('2A'), false);
    assert.equal(serialized.includes('1A'), false);
    assert.equal(serialized.includes('15000'), false);
    assert.equal(result.error, 'INSUFFICIENT_PERMISSIONS');
  });

  it('does not let an admin read another building', () => {
    const result = expenseStandingForActor(admin(), otro, standing);
    assert.equal(result.ok, false);
    if (result.ok) return;
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes('2A'), false);
    assert.equal(serialized.includes('15000'), false);
  });

  it('returns unit standing for the admin of that building', () => {
    const result = expenseStandingForActor(admin(), torre, standing);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.units.length, 2);
    assert.equal(result.units[1]?.unitName, '2A');
  });

  it('hides listExpenseStanding from owners', () => {
    assert.equal(toolsForActor(owner()).includes('listExpenseStanding'), false);
    assert.equal(toolsForActor(admin()).includes('listExpenseStanding'), true);
  });

  it('lets residents prepare a claim and only admins resolve one', () => {
    assert.equal(toolsForActor(owner()).includes('listClaims'), true);
    assert.equal(toolsForActor(owner()).includes('draftClaim'), true);
    assert.equal(
      toolsForActor(owner()).includes('draftClaimResolution'),
      false,
    );
    assert.equal(toolsForActor(admin()).includes('listClaims'), true);
    assert.equal(toolsForActor(admin()).includes('draftClaimResolution'), true);
  });
});

describe('my reservations', () => {
  it('gives owners the tool and only their buildings', () => {
    assert.equal(toolsForActor(owner()).includes('listMyReservations'), true);
    const scope = myReservationScope(owner());
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.deepEqual(scope.buildingIds, [torre]);
    assert.deepEqual(scope.unitIds, ['u1']);
  });

  it('does not open another building', () => {
    const scope = myReservationScope(owner(), otro);
    assert.equal(scope.ok, false);
    if (scope.ok) return;
    assert.equal(scope.error, 'INSUFFICIENT_PERMISSIONS');
    assert.equal(JSON.stringify(scope).includes('1A'), false);
  });

  it('lets a superadmin list their own reservations in any building', () => {
    const scope = myReservationScope(
      {...admin(), globalRole: 'SUPERADMIN', buildings: [], units: []},
      otro,
    );
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.deepEqual(scope.buildingIds, [otro]);
    assert.deepEqual(scope.unitIds, []);
  });
});

describe('own expenses', () => {
  it('keeps only the owner unit', () => {
    const result = expensesForActor(owner(), torre, expenses);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(
      result.expenses.map(row => row.unitName),
      ['1A'],
    );
    assert.equal(JSON.stringify(result).includes('2A'), false);
  });
});

describe('document search permissions', () => {
  it('allows members of the building and blocks the rest', () => {
    assert.equal(canSearchBuildingDocs(owner(), torre), true);
    assert.equal(canSearchBuildingDocs(owner(), otro), false);
    assert.equal(canSearchBuildingDocs(admin(), otro), false);
    assert.equal(
      canSearchBuildingDocs(
        {...admin(), globalRole: 'SUPERADMIN', buildings: []},
        otro,
      ),
      true,
    );
  });
});

describe('confirmReservationDraft', () => {
  const startsAt = new Date('2026-11-13T18:00:00.000Z');

  it('calls createReservation only after the user confirms', async () => {
    const calls: {
      viewerId: string;
      buildingAmenityId: string;
      unitId: string;
    }[] = [];
    const draft = {
      userId: 'owner-1',
      buildingId: torre,
      buildingAmenityId: 'amenity-zoom',
      unitId: 'u1',
      startsAt,
      notes: null,
    };

    const denied = await confirmReservationDraft({
      actor: owner(),
      draft,
      userConfirmed: false,
      createReservation: async () => {
        throw new Error('should not book');
      },
    });
    assert.equal(denied.ok, false);
    if (denied.ok) return;
    assert.equal(denied.error, 'CONFIRMATION_REQUIRED');

    const confirmed = await confirmReservationDraft({
      actor: owner(),
      draft,
      userConfirmed: true,
      createReservation: async params => {
        calls.push({
          viewerId: params.viewerId,
          buildingAmenityId: params.buildingAmenityId,
          unitId: params.unitId,
        });
        return {id: 'reservation-1'};
      },
    });

    assert.equal(confirmed.ok, true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      viewerId: 'owner-1',
      buildingAmenityId: 'amenity-zoom',
      unitId: 'u1',
    });
  });

  it('does not book a unit the owner is not linked to', async () => {
    const result = await confirmReservationDraft({
      actor: owner(),
      draft: {
        userId: 'owner-1',
        buildingId: torre,
        buildingAmenityId: 'amenity-zoom',
        unitId: 'u2',
        startsAt,
        notes: null,
      },
      userConfirmed: true,
      createReservation: async () => {
        throw new Error('should not book');
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, 'UNIT_NOT_LINKED');
  });
});
