import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  normalizePlate,
  parseHouseholdMember,
  parsePet,
  parseVehicle,
  unitAccess,
  type HouseholdViewer,
} from './householdRules.js';

const unit = {id: 'unit-1', buildingId: 'building-1'};

function viewer(overrides: Partial<HouseholdViewer> = {}): HouseholdViewer {
  return {
    globalRole: 'USER',
    buildingUsers: [],
    userUnits: [],
    ...overrides,
  };
}

describe('unitAccess', () => {
  it('allows a superadmin', () => {
    assert.equal(unitAccess(viewer({globalRole: 'SUPERADMIN'}), unit), 'OK');
  });

  it('allows the building admin', () => {
    assert.equal(
      unitAccess(
        viewer({
          buildingUsers: [{buildingId: 'building-1', role: {name: 'Admin'}}],
        }),
        unit,
      ),
      'OK',
    );
  });

  it('allows an owner linked to the unit', () => {
    assert.equal(
      unitAccess(
        viewer({
          buildingUsers: [{buildingId: 'building-1', role: {name: 'Owner'}}],
          userUnits: [
            {
              unitId: 'unit-1',
              relationType: 'OWNER',
              unit: {buildingId: 'building-1'},
            },
          ],
        }),
        unit,
      ),
      'OK',
    );
  });

  it('rejects an owner whose only link is as roomer', () => {
    assert.equal(
      unitAccess(
        viewer({
          buildingUsers: [{buildingId: 'building-1', role: {name: 'Owner'}}],
          userUnits: [
            {
              unitId: 'unit-1',
              relationType: 'ROOMER',
              unit: {buildingId: 'building-1'},
            },
          ],
        }),
        unit,
      ),
      'UNIT_NOT_LINKED',
    );
  });

  it('allows a roomer linked to the unit', () => {
    assert.equal(
      unitAccess(
        viewer({
          buildingUsers: [{buildingId: 'building-1', role: {name: 'Roomer'}}],
          userUnits: [
            {
              unitId: 'unit-1',
              relationType: 'ROOMER',
              unit: {buildingId: 'building-1'},
            },
          ],
        }),
        unit,
      ),
      'OK',
    );
  });

  it('rejects an owner of another unit', () => {
    assert.equal(
      unitAccess(
        viewer({
          buildingUsers: [{buildingId: 'building-1', role: {name: 'Owner'}}],
          userUnits: [
            {
              unitId: 'unit-2',
              relationType: 'OWNER',
              unit: {buildingId: 'building-1'},
            },
          ],
        }),
        unit,
      ),
      'UNIT_NOT_LINKED',
    );
  });

  it('rejects someone from another building', () => {
    assert.equal(
      unitAccess(
        viewer({
          buildingUsers: [{buildingId: 'building-2', role: {name: 'Admin'}}],
        }),
        unit,
      ),
      'INSUFFICIENT_PERMISSIONS',
    );
  });
});

describe('parseHouseholdMember', () => {
  it('accepts a spouse and trims optional fields', () => {
    assert.deepEqual(
      parseHouseholdMember({
        firstName: ' Ana ',
        lastName: 'Lopez',
        relation: 'SPOUSE',
        documentNumber: ' 30111222 ',
        phone: '',
      }),
      {
        firstName: 'Ana',
        lastName: 'Lopez',
        relation: 'SPOUSE',
        documentNumber: '30111222',
        phone: null,
      },
    );
  });

  it('rejects an empty name', () => {
    assert.equal(
      parseHouseholdMember({firstName: ' ', lastName: 'Lopez', relation: 'CHILD'}),
      'INVALID_HOUSEHOLD',
    );
  });

  it('rejects an unknown relation', () => {
    assert.equal(
      parseHouseholdMember({
        firstName: 'Ana',
        lastName: 'Lopez',
        relation: 'COUSIN',
      }),
      'INVALID_HOUSEHOLD',
    );
  });

  it('rejects a document that is too long', () => {
    assert.equal(
      parseHouseholdMember({
        firstName: 'Ana',
        lastName: 'Lopez',
        relation: 'PARENT',
        documentNumber: '1'.repeat(33),
      }),
      'INVALID_HOUSEHOLD',
    );
  });
});

describe('parseVehicle', () => {
  it('normalizes spaces and hyphens', () => {
    assert.equal(normalizePlate(' ab-123-cd '), 'AB123CD');
    assert.deepEqual(parseVehicle({plate: 'ab 123 cd', make: ' Ford '}), {
      plate: 'AB123CD',
      make: 'Ford',
      model: null,
      color: null,
    });
  });

  it('rejects an empty plate', () => {
    assert.equal(parseVehicle({plate: ' - '}), 'INVALID_HOUSEHOLD');
  });

  it('rejects symbols that are not part of a plate', () => {
    assert.equal(normalizePlate('AB.123'), null);
    assert.equal(parseVehicle({plate: 'AB.123'}), 'INVALID_HOUSEHOLD');
  });
});

describe('parsePet', () => {
  it('accepts a dog without notes', () => {
    assert.deepEqual(parsePet({name: ' Otto ', species: 'DOG', notes: '  '}), {
      name: 'Otto',
      species: 'DOG',
      notes: null,
    });
  });

  it('rejects notes that are too long', () => {
    assert.equal(
      parsePet({name: 'Otto', species: 'CAT', notes: 'n'.repeat(301)}),
      'INVALID_HOUSEHOLD',
    );
  });

  it('rejects an unknown species', () => {
    assert.equal(parsePet({name: 'Otto', species: 'BIRD'}), 'INVALID_HOUSEHOLD');
  });
});
