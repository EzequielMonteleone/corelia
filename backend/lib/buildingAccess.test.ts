import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  asBuildingRole,
  buildingIsOpen,
  canAccessBuilding,
  canDeleteBuilding,
  canOpenBuilding,
  listedBuildingIds,
  toBuildingMember,
} from './buildingAccess.js';
import type {BuildingMember} from '../types/member.js';

const buildingId = 'building-1';

function member(overrides: Partial<BuildingMember> = {}): BuildingMember {
  return {
    globalRole: 'USER',
    buildings: [],
    ...overrides,
  };
}

describe('asBuildingRole', () => {
  it('keeps the three building roles and drops the rest', () => {
    assert.equal(asBuildingRole('Admin'), 'Admin');
    assert.equal(asBuildingRole('Owner'), 'Owner');
    assert.equal(asBuildingRole('Roomer'), 'Roomer');
    assert.equal(asBuildingRole('SUPERADMIN'), null);
  });
});

describe('canAccessBuilding', () => {
  const admin = member({buildings: [{id: buildingId, role: 'Admin'}]});
  const owner = member({buildings: [{id: buildingId, role: 'Owner'}]});
  const superadmin = member({globalRole: 'SUPERADMIN'});

  it('lets a superadmin in as admin or member without a membership', () => {
    assert.equal(canAccessBuilding(superadmin, buildingId, 'admin'), true);
    assert.equal(canAccessBuilding(superadmin, buildingId, 'member'), true);
  });

  it('lets an admin manage and a owner only enter', () => {
    assert.equal(canAccessBuilding(admin, buildingId, 'admin'), true);
    assert.equal(canAccessBuilding(admin, buildingId, 'member'), true);
    assert.equal(canAccessBuilding(owner, buildingId, 'member'), true);
    assert.equal(canAccessBuilding(owner, buildingId, 'admin'), false);
  });

  it('refuses someone from another building', () => {
    assert.equal(canAccessBuilding(admin, 'other', 'member'), false);
  });
});

describe('listedBuildingIds', () => {
  it('lists every building for a superadmin who is also an admin', () => {
    const scope = listedBuildingIds(
      member({
        globalRole: 'SUPERADMIN',
        buildings: [{id: buildingId, role: 'Admin'}],
      }),
    );
    assert.deepEqual(scope, {kind: 'all'});
  });

  it('keeps only the admin buildings when the person is also an owner', () => {
    const scope = listedBuildingIds(
      member({
        buildings: [
          {id: 'owned', role: 'Owner'},
          {id: buildingId, role: 'Admin'},
        ],
      }),
    );
    assert.deepEqual(scope, {kind: 'ids', ids: [buildingId]});
  });

  it('falls through to owner, then roomer, then none', () => {
    assert.deepEqual(
      listedBuildingIds(member({buildings: [{id: 'owned', role: 'Owner'}]})),
      {kind: 'ids', ids: ['owned']},
    );
    assert.deepEqual(
      listedBuildingIds(member({buildings: [{id: 'rented', role: 'Roomer'}]})),
      {kind: 'ids', ids: ['rented']},
    );
    assert.deepEqual(listedBuildingIds(member()), {kind: 'none'});
  });
});

describe('canOpenBuilding', () => {
  it('lets a superadmin, an admin, and an owner open the building', () => {
    assert.equal(
      canOpenBuilding(member({globalRole: 'SUPERADMIN'}), buildingId),
      true,
    );
    assert.equal(
      canOpenBuilding(
        member({buildings: [{id: buildingId, role: 'Admin'}]}),
        buildingId,
      ),
      true,
    );
    assert.equal(
      canOpenBuilding(
        member({buildings: [{id: buildingId, role: 'Owner'}]}),
        buildingId,
      ),
      true,
    );
  });

  it('refuses a roomer and someone from another building', () => {
    assert.equal(
      canOpenBuilding(
        member({buildings: [{id: buildingId, role: 'Roomer'}]}),
        buildingId,
      ),
      false,
    );
    assert.equal(
      canOpenBuilding(
        member({buildings: [{id: 'other', role: 'Admin'}]}),
        buildingId,
      ),
      false,
    );
  });
});

describe('canDeleteBuilding', () => {
  it('allows only a superadmin', () => {
    assert.equal(canDeleteBuilding(member({globalRole: 'SUPERADMIN'})), true);
    assert.equal(
      canDeleteBuilding(member({buildings: [{id: buildingId, role: 'Admin'}]})),
      false,
    );
  });
});

describe('buildingIsOpen', () => {
  it('keeps an active building and drops a paused or deleted one', () => {
    assert.equal(buildingIsOpen({active: true, deleted: false}), true);
    assert.equal(buildingIsOpen({active: false, deleted: false}), false);
    assert.equal(buildingIsOpen({active: true, deleted: true}), false);
  });
});

describe('toBuildingMember', () => {
  it('drops unknown role names', () => {
    const actor = toBuildingMember({
      globalRole: 'USER',
      buildingUsers: [
        {buildingId, role: {name: 'Admin'}},
        {buildingId: 'other', role: {name: 'Porter'}},
      ],
    });
    assert.deepEqual(actor.buildings, [{id: buildingId, role: 'Admin'}]);
  });

  it('drops memberships on inactive or deleted buildings', () => {
    const actor = toBuildingMember({
      globalRole: 'USER',
      buildingUsers: [
        {
          buildingId,
          role: {name: 'Admin'},
          building: {active: false, deleted: false},
        },
        {
          buildingId: 'gone',
          role: {name: 'Owner'},
          building: {active: true, deleted: true},
        },
        {
          buildingId: 'open',
          role: {name: 'Roomer'},
          building: {active: true, deleted: false},
        },
      ],
    });
    assert.deepEqual(actor.buildings, [{id: 'open', role: 'Roomer'}]);
    assert.equal(canAccessBuilding(actor, buildingId, 'member'), false);
    assert.equal(canAccessBuilding(actor, 'open', 'member'), true);
  });
});
