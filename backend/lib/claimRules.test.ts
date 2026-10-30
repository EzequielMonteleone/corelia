import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  canManageClaim,
  claimAmenityAccess,
  claimCreateAccess,
  claimDraftConfirmAccess,
  claimListScope,
  parseClaimCreate,
  parseClaimTarget,
  parseClaimUpdate,
  type ClaimActor,
} from './claimRules.js';

const buildingId = 'building-1';
const unit = {id: 'unit-1', buildingId};

function actor(overrides: Partial<ClaimActor> = {}): ClaimActor {
  return {
    userId: 'user-1',
    globalRole: 'USER',
    buildings: [],
    units: [],
    ...overrides,
  };
}

const owner = actor({
  buildings: [{id: buildingId, role: 'Owner'}],
  units: [{id: 'unit-1', buildingId, relationType: 'OWNER'}],
});

const roomer = actor({
  userId: 'roomer-1',
  buildings: [{id: buildingId, role: 'Roomer'}],
  units: [{id: 'unit-1', buildingId, relationType: 'ROOMER'}],
});

const admin = actor({
  userId: 'admin-1',
  buildings: [{id: buildingId, role: 'Admin'}],
  units: [{id: 'unit-1', buildingId, relationType: 'OWNER'}],
});

describe('claimCreateAccess', () => {
  it('lets an owner create on the linked unit', () => {
    assert.equal(claimCreateAccess(owner, unit), 'OK');
  });

  it('lets a roomer create on the linked unit', () => {
    assert.equal(claimCreateAccess(roomer, unit), 'OK');
  });

  it('refuses an owner on another unit', () => {
    assert.equal(
      claimCreateAccess(owner, {id: 'unit-2', buildingId}),
      'UNIT_NOT_LINKED',
    );
  });

  it('ignores a link that does not match the role', () => {
    const mismatched = actor({
      buildings: [{id: buildingId, role: 'Owner'}],
      units: [{id: 'unit-1', buildingId, relationType: 'ROOMER'}],
    });
    assert.equal(claimCreateAccess(mismatched, unit), 'UNIT_NOT_LINKED');
  });

  it('does not let an admin create, even with a unit link', () => {
    assert.equal(claimCreateAccess(admin, unit), 'INSUFFICIENT_PERMISSIONS');
  });

  it('does not let a superadmin create without a resident link', () => {
    assert.equal(
      claimCreateAccess(actor({globalRole: 'SUPERADMIN'}), unit),
      'INSUFFICIENT_PERMISSIONS',
    );
  });
});

describe('claimListScope', () => {
  it('gives the admin every unit and no create flag', () => {
    const scope = claimListScope(admin, buildingId);
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.equal(scope.unitIds, null);
    assert.equal(scope.canCreate, false);
  });

  it('keeps create closed when an admin filters a unit', () => {
    const scope = claimListScope(admin, buildingId, {unitId: 'unit-1'});
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.deepEqual(scope.unitIds, ['unit-1']);
    assert.equal(scope.canCreate, false);
  });

  it('limits an owner to units whose link matches the role', () => {
    const mixed = actor({
      buildings: [{id: buildingId, role: 'Owner'}],
      units: [
        {id: 'unit-1', buildingId, relationType: 'OWNER'},
        {id: 'unit-2', buildingId, relationType: 'ROOMER'},
      ],
    });
    const scope = claimListScope(mixed, buildingId);
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.deepEqual(scope.unitIds, ['unit-1']);
    assert.equal(scope.canCreate, false);
  });

  it('opens create only for the selected resident unit', () => {
    const scope = claimListScope(roomer, buildingId, {unitId: 'unit-1'});
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.equal(scope.canCreate, true);
  });

  it('refuses a unit the resident is not linked to', () => {
    const scope = claimListScope(owner, buildingId, {unitId: 'unit-2'});
    assert.equal(scope.ok, false);
    if (scope.ok) return;
    assert.equal(scope.error, 'UNIT_NOT_LINKED');
  });

  it('lets a resident file an amenity claim and hides that from the admin', () => {
    const resident = claimListScope(roomer, buildingId, {
      buildingAmenityId: 'amenity-1',
    });
    assert.equal(resident.ok, true);
    if (!resident.ok) return;
    assert.equal(resident.canCreate, true);
    assert.equal(resident.canCreateAmenity, true);
    assert.equal(resident.includeAmenityClaims, true);

    const managed = claimListScope(admin, buildingId);
    assert.equal(managed.ok, true);
    if (!managed.ok) return;
    assert.equal(managed.canCreateAmenity, false);
    assert.equal(managed.includeAmenityClaims, true);
  });

  it('includes amenity claims when a resident does not filter', () => {
    const scope = claimListScope(owner, buildingId);
    assert.equal(scope.ok, true);
    if (!scope.ok) return;
    assert.equal(scope.includeAmenityClaims, true);
    assert.equal(scope.canCreate, false);
    assert.equal(scope.canCreateAmenity, true);
  });

  it('refuses another building', () => {
    const scope = claimListScope(owner, 'other');
    assert.equal(scope.ok, false);
    if (scope.ok) return;
    assert.equal(scope.error, 'INSUFFICIENT_PERMISSIONS');
  });
});

describe('canManageClaim', () => {
  it('allows the building admin and a superadmin', () => {
    assert.equal(canManageClaim(admin, buildingId), true);
    assert.equal(
      canManageClaim(actor({globalRole: 'SUPERADMIN'}), buildingId),
      true,
    );
  });

  it('refuses the resident', () => {
    assert.equal(canManageClaim(owner, buildingId), false);
    assert.equal(canManageClaim(roomer, buildingId), false);
  });
});

describe('parseClaimCreate', () => {
  it('trims title and body', () => {
    assert.deepEqual(
      parseClaimCreate({title: '  Luz  ', body: '  No enciende  '}),
      {
        title: 'Luz',
        body: 'No enciende',
      },
    );
  });

  it('rejects an empty or oversized field', () => {
    assert.equal(
      parseClaimCreate({title: '  ', body: 'texto'}),
      'INVALID_CLAIM',
    );
    assert.equal(
      parseClaimCreate({title: 'título', body: ''}),
      'INVALID_CLAIM',
    );
    assert.equal(
      parseClaimCreate({title: 'a'.repeat(121), body: 'texto'}),
      'INVALID_CLAIM',
    );
    assert.equal(
      parseClaimCreate({title: 'título', body: 'a'.repeat(2001)}),
      'INVALID_CLAIM',
    );
  });
});

describe('parseClaimUpdate', () => {
  it('accepts a status, a reply, or both', () => {
    assert.deepEqual(parseClaimUpdate({status: 'CLOSED'}), {status: 'CLOSED'});
    assert.deepEqual(parseClaimUpdate({reply: '  Listo  '}), {reply: 'Listo'});
    assert.deepEqual(parseClaimUpdate({status: 'IN_PROGRESS', reply: ''}), {
      status: 'IN_PROGRESS',
      reply: null,
    });
  });

  it('rejects an empty update or a bad status', () => {
    assert.equal(parseClaimUpdate({}), 'INVALID_CLAIM');
    assert.equal(parseClaimUpdate({status: 'DONE'}), 'INVALID_CLAIM');
    assert.equal(parseClaimUpdate({reply: 'a'.repeat(2001)}), 'INVALID_CLAIM');
  });
});

describe('claimDraftConfirmAccess', () => {
  it('rechecks create for the resident who owns the draft', () => {
    assert.equal(
      claimDraftConfirmAccess(owner, {
        userId: owner.userId,
        kind: 'CREATE',
        buildingId,
        unitId: 'unit-1',
        buildingAmenityId: null,
      }),
      'OK',
    );
  });

  it('hides a draft that belongs to someone else', () => {
    assert.equal(
      claimDraftConfirmAccess(owner, {
        userId: 'other',
        kind: 'CREATE',
        buildingId,
        unitId: 'unit-1',
        buildingAmenityId: null,
      }),
      'DRAFT_NOT_FOUND',
    );
  });

  it('lets only the admin confirm a resolution', () => {
    assert.equal(
      claimDraftConfirmAccess(admin, {
        userId: admin.userId,
        kind: 'RESOLVE',
        buildingId,
        unitId: null,
        buildingAmenityId: null,
      }),
      'OK',
    );
    assert.equal(
      claimDraftConfirmAccess(owner, {
        userId: owner.userId,
        kind: 'RESOLVE',
        buildingId,
        unitId: null,
        buildingAmenityId: null,
      }),
      'INSUFFICIENT_PERMISSIONS',
    );
  });

  it('lets a resident confirm an amenity draft', () => {
    assert.equal(
      claimDraftConfirmAccess(roomer, {
        userId: roomer.userId,
        kind: 'CREATE',
        buildingId,
        unitId: null,
        buildingAmenityId: 'amenity-1',
      }),
      'OK',
    );
    assert.equal(
      claimAmenityAccess(admin, buildingId),
      'INSUFFICIENT_PERMISSIONS',
    );
  });
});

describe('parseClaimTarget', () => {
  it('accepts a unit or an amenity, not both and not neither', () => {
    assert.deepEqual(parseClaimTarget({unitId: ' unit-1 '}), {
      kind: 'unit',
      unitId: 'unit-1',
    });
    assert.deepEqual(parseClaimTarget({buildingAmenityId: 'amenity-1'}), {
      kind: 'amenity',
      buildingAmenityId: 'amenity-1',
    });
    assert.equal(
      parseClaimTarget({unitId: 'unit-1', buildingAmenityId: 'amenity-1'}),
      'INVALID_CLAIM',
    );
    assert.equal(parseClaimTarget({}), 'INVALID_CLAIM');
  });
});
