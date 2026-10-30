import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  assignableRoles,
  canCreateRole,
  canEditUser,
  canManageUser,
  decideUserEdit,
  userAuditEvents,
  validateUnitAssignment,
  visibleUserScope,
  type AccessPerson,
} from './userAccess.js';

const buildingId = 'building-1';

function person(overrides: Partial<AccessPerson> = {}): AccessPerson {
  return {
    id: 'user-1',
    globalRole: 'USER',
    buildings: [],
    units: [],
    ownedUnitIds: [],
    ...overrides,
  };
}

const admin = person({
  id: 'admin',
  buildings: [{id: buildingId, role: 'Admin'}],
});
const owner = person({
  id: 'owner',
  buildings: [{id: buildingId, role: 'Owner'}],
  units: [{id: 'unit-a', buildingId}],
  ownedUnitIds: ['unit-a'],
});
const roomer = person({
  id: 'roomer',
  buildings: [{id: buildingId, role: 'Roomer'}],
  units: [{id: 'unit-a', buildingId}],
});
const otherRoomer = person({
  id: 'other-roomer',
  buildings: [{id: buildingId, role: 'Roomer'}],
  units: [{id: 'unit-b', buildingId}],
});
const superadmin = person({
  id: 'super',
  globalRole: 'SUPERADMIN',
});

describe('visibleUserScope', () => {
  it('keeps a superadmin who administers a building on those buildings', () => {
    assert.deepEqual(
      visibleUserScope(
        person({
          globalRole: 'SUPERADMIN',
          buildings: [{id: buildingId, role: 'Admin'}],
        }),
      ),
      {kind: 'admin-buildings', buildingIds: [buildingId]},
    );
  });

  it('lists every account when a superadmin administers none', () => {
    assert.deepEqual(visibleUserScope(person({globalRole: 'SUPERADMIN'})), {
      kind: 'all',
    });
  });

  it('lists roomers for an owner and ignores a roomer membership', () => {
    assert.deepEqual(
      visibleUserScope(
        person({
          buildings: [
            {id: buildingId, role: 'Owner'},
            {id: 'other', role: 'Roomer'},
          ],
        }),
      ),
      {kind: 'owner-roomers', buildingIds: [buildingId]},
    );
  });

  it('shows nobody to a roomer', () => {
    assert.deepEqual(
      visibleUserScope(person({buildings: [{id: buildingId, role: 'Roomer'}]})),
      {kind: 'none'},
    );
  });
});

describe('canManageUser', () => {
  it('lets a superadmin manage anyone, including another superadmin', () => {
    assert.equal(canManageUser(superadmin, admin, buildingId), true);
    assert.equal(
      canManageUser(
        superadmin,
        person({id: 'other-super', globalRole: 'SUPERADMIN'}),
        buildingId,
      ),
      true,
    );
  });

  it('lets an admin manage owners and roomers in the building', () => {
    assert.equal(canManageUser(admin, owner, buildingId), true);
    assert.equal(canManageUser(admin, roomer, buildingId), true);
  });

  it('refuses peers, superiors, and a superadmin target', () => {
    assert.equal(
      canManageUser(
        admin,
        person({id: 'admin-2', buildings: [{id: buildingId, role: 'Admin'}]}),
        buildingId,
      ),
      false,
    );
    assert.equal(canManageUser(roomer, admin, buildingId), false);
    assert.equal(canManageUser(owner, admin, buildingId), false);
    assert.equal(canManageUser(admin, superadmin, buildingId), false);
  });

  it('lets an owner manage only a roomer on one of their units', () => {
    assert.equal(canManageUser(owner, roomer, buildingId), true);
    assert.equal(canManageUser(owner, otherRoomer, buildingId), false);
  });
});

describe('canEditUser', () => {
  it('follows canManageUser and also allows editing yourself', () => {
    assert.equal(canEditUser(admin, owner), true);
    assert.equal(
      canEditUser(
        admin,
        person({id: 'admin-2', buildings: [{id: buildingId, role: 'Admin'}]}),
      ),
      false,
    );
    assert.equal(canEditUser(owner, roomer), true);
    assert.equal(canEditUser(owner, otherRoomer), false);
    assert.equal(canEditUser(superadmin, person({id: 'solo'})), true);
    assert.equal(canEditUser(roomer, roomer), true);
  });
});

describe('canCreateRole', () => {
  it('lets each rank create only the role directly below', () => {
    assert.equal(canCreateRole('SUPERADMIN', null, 'Admin'), true);
    assert.equal(canCreateRole('SUPERADMIN', null, 'Owner'), false);
    assert.equal(canCreateRole('USER', 'Admin', 'Owner'), true);
    assert.equal(canCreateRole('USER', 'Admin', 'Roomer'), false);
    assert.equal(canCreateRole('USER', 'Owner', 'Roomer'), true);
    assert.equal(canCreateRole('USER', 'Roomer', 'Roomer'), false);
  });
});

describe('assignableRoles', () => {
  it('includes the unit selection the form needs', () => {
    assert.deepEqual(
      assignableRoles({globalRole: 'USER', buildingRole: 'Admin'}),
      [{name: 'Owner', unitSelection: 'many', relation: 'OWNER'}],
    );
    assert.deepEqual(
      assignableRoles({globalRole: 'USER', buildingRole: 'Owner'}),
      [{name: 'Roomer', unitSelection: 'one', relation: 'ROOMER'}],
    );
  });
});

describe('validateUnitAssignment', () => {
  it('checks cardinality and that an owner only assigns their units', () => {
    assert.equal(
      validateUnitAssignment({
        roleName: 'Admin',
        unitIds: ['unit-a'],
        actorIsOwner: false,
        ownedUnitIds: [],
      }),
      'ADMIN_CANNOT_HAVE_UNITS',
    );
    assert.equal(
      validateUnitAssignment({
        roleName: 'Roomer',
        unitIds: [],
        actorIsOwner: true,
        ownedUnitIds: ['unit-a'],
      }),
      'ROOMER_SINGLE_UNIT_REQUIRED',
    );
    assert.equal(
      validateUnitAssignment({
        roleName: 'Roomer',
        unitIds: ['unit-b'],
        actorIsOwner: true,
        ownedUnitIds: ['unit-a'],
      }),
      'OWNER_CAN_ASSIGN_ONLY_OWN_UNITS',
    );
    assert.equal(
      validateUnitAssignment({
        roleName: 'Roomer',
        unitIds: ['unit-a'],
        actorIsOwner: true,
        ownedUnitIds: ['unit-a'],
      }),
      null,
    );
  });
});

describe('decideUserEdit', () => {
  it('lets someone edit their own profile and ignores role fields', () => {
    const decision = decideUserEdit(roomer, roomer, {
      firstName: 'Ana',
      roleName: 'Admin',
      buildingId,
      unitIds: [],
      isActive: false,
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;
    assert.equal(decision.profile.firstName, 'Ana');
    assert.equal(decision.profile.isActive, undefined);
    assert.equal(decision.assignment, undefined);
  });

  it('requires the current password when changing your own', () => {
    const missing = decideUserEdit(roomer, roomer, {password: 'nueva-clave'});
    assert.deepEqual(missing, {
      ok: false,
      error: 'CURRENT_PASSWORD_REQUIRED',
      status: 400,
    });

    const ready = decideUserEdit(roomer, roomer, {
      password: 'nueva-clave',
      currentPassword: 'actual',
    });
    assert.equal(ready.ok, true);
    if (!ready.ok) return;
    assert.equal(ready.currentPassword, 'actual');
    assert.equal(ready.profile.passwordPlain, 'nueva-clave');
  });

  it('rejects a short password', () => {
    const decision = decideUserEdit(admin, owner, {
      buildingId,
      password: 'short',
    });
    assert.deepEqual(decision, {
      ok: false,
      error: 'PASSWORD_TOO_SHORT',
      status: 400,
    });
  });

  it('lets an admin reset a subordinate password without the current one', () => {
    const decision = decideUserEdit(admin, owner, {
      buildingId,
      password: 'nueva-clave',
      roleName: 'Owner',
      unitIds: ['unit-a'],
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;
    assert.equal(decision.currentPassword, undefined);
    assert.equal(decision.profile.passwordPlain, 'nueva-clave');
  });

  it('refuses a roomer editing the admin', () => {
    const decision = decideUserEdit(roomer, admin, {
      buildingId,
      password: 'nueva-clave',
      roleName: 'Roomer',
    });
    assert.deepEqual(decision, {
      ok: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      status: 403,
    });
  });

  it('refuses an owner demoting an admin', () => {
    const decision = decideUserEdit(owner, admin, {
      buildingId,
      roleName: 'Roomer',
      unitIds: ['unit-a'],
    });
    assert.deepEqual(decision, {
      ok: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      status: 403,
    });
  });

  it('refuses a role change when the current role is not one you can assign', () => {
    const decision = decideUserEdit(admin, roomer, {
      buildingId,
      roleName: 'Owner',
      unitIds: ['unit-a'],
    });
    assert.deepEqual(decision, {
      ok: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      status: 403,
    });
  });

  it('keeps a roomer edit when the role stays the same', () => {
    const decision = decideUserEdit(admin, roomer, {
      buildingId,
      firstName: 'Luis',
      roleName: 'Roomer',
      unitIds: ['unit-a'],
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;
    assert.equal(decision.profile.firstName, 'Luis');
    assert.equal(decision.assignment, undefined);
  });

  it('applies a unit change for a roomer without changing the role', () => {
    const decision = decideUserEdit(admin, roomer, {
      buildingId,
      roleName: 'Roomer',
      unitIds: ['unit-b'],
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;
    assert.deepEqual(decision.assignment, {
      buildingId,
      roleName: 'Roomer',
      unitIds: ['unit-b'],
    });
  });

  it('lets a superadmin edit an owner profile but not reassign that role to Admin', () => {
    const profile = decideUserEdit(superadmin, owner, {
      buildingId,
      firstName: 'María',
      roleName: 'Owner',
      unitIds: ['unit-a'],
    });
    assert.equal(profile.ok, true);
    if (!profile.ok) return;
    assert.equal(profile.assignment, undefined);

    const promotion = decideUserEdit(superadmin, owner, {
      buildingId,
      roleName: 'Admin',
      unitIds: [],
    });
    assert.deepEqual(promotion, {
      ok: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      status: 403,
    });
  });
});

const previousAccess = {
  isActive: true,
  buildingId,
  role: 'Roomer' as const,
  unitIds: ['unit-a'],
};

describe('userAuditEvents', () => {
  it('records a self password change without the password', () => {
    const decision = decideUserEdit(roomer, roomer, {
      password: 'nueva-clave',
      currentPassword: 'actual',
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;

    const events = userAuditEvents({
      actorId: roomer.id,
      targetId: roomer.id,
      previous: previousAccess,
      decision,
    });
    assert.deepEqual(events, [
      {
        action: 'USER_PASSWORD_CHANGED',
        buildingId,
        metadata: {},
      },
    ]);
    assert.equal(JSON.stringify(events).includes('nueva-clave'), false);
  });

  it('records a reset when someone else sets the password', () => {
    const decision = decideUserEdit(admin, roomer, {
      buildingId,
      password: 'nueva-clave',
      roleName: 'Roomer',
      unitIds: ['unit-a'],
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;

    const events = userAuditEvents({
      actorId: admin.id,
      targetId: roomer.id,
      previous: previousAccess,
      decision,
    });
    assert.equal(events.length, 1);
    assert.equal(events[0]?.action, 'USER_PASSWORD_RESET');
    assert.equal(JSON.stringify(events).includes('nueva-clave'), false);
  });

  it('records a role or unit change and an active-state change', () => {
    const decision = decideUserEdit(admin, roomer, {
      buildingId,
      roleName: 'Roomer',
      unitIds: ['unit-b'],
      isActive: false,
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;

    assert.deepEqual(
      userAuditEvents({
        actorId: admin.id,
        targetId: roomer.id,
        previous: previousAccess,
        decision,
      }),
      [
        {
          action: 'USER_ACTIVE_CHANGED',
          buildingId,
          metadata: {isActive: false},
        },
        {
          action: 'USER_ROLE_CHANGED',
          buildingId,
          metadata: {
            previousRole: 'Roomer',
            nextRole: 'Roomer',
            previousUnitIds: ['unit-a'],
            unitIds: ['unit-b'],
          },
        },
      ],
    );
  });

  it('skips a name change', () => {
    const decision = decideUserEdit(admin, roomer, {
      buildingId,
      firstName: 'Luis',
      roleName: 'Roomer',
      unitIds: ['unit-a'],
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;

    assert.deepEqual(
      userAuditEvents({
        actorId: admin.id,
        targetId: roomer.id,
        previous: previousAccess,
        decision,
      }),
      [],
    );
  });

  it('allows a password change with no building', () => {
    const decision = decideUserEdit(superadmin, superadmin, {
      password: 'nueva-clave',
      currentPassword: 'actual',
    });
    assert.equal(decision.ok, true);
    if (!decision.ok) return;

    const events = userAuditEvents({
      actorId: superadmin.id,
      targetId: superadmin.id,
      previous: {
        isActive: true,
        buildingId: null,
        role: null,
        unitIds: [],
      },
      decision,
    });
    assert.deepEqual(events, [
      {
        action: 'USER_PASSWORD_CHANGED',
        buildingId: null,
        metadata: {},
      },
    ]);
  });
});
