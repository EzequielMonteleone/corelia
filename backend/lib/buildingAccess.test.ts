import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  asBuildingRole,
  canAccessBuilding,
  toBuildingMember,
  type BuildingMember,
} from './buildingAccess.js';

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
});
