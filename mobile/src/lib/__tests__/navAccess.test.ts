import {
  buildingRoles,
  canAccessPath,
  hasBuildingRole,
  isSuperAdmin,
} from '@/lib/navAccess';
import type {BuildingUser, UserData} from '@/types/user';

function user(
  globalRole: string,
  roles: string[] = [],
): UserData {
  return {
    id: 'user-1',
    email: 'user@corelia.com',
    firstName: 'Test',
    lastName: 'User',
    globalRole,
    isActive: true,
    buildingUsers: roles.map(
      (role, index) =>
        ({
          id: `membership-${index}`,
          buildingId: `building-${index}`,
          userId: 'user-1',
          roleId: `role-${index}`,
          createdAt: '',
          updatedAt: '',
          role: {id: `role-${index}`, name: role},
        }) as unknown as BuildingUser,
    ),
  };
}

describe('navAccess', () => {
  it('lets superadmins access every route', () => {
    const admin = user('SUPERADMIN');
    expect(isSuperAdmin(admin)).toBe(true);
    expect(canAccessPath(admin, '/roles')).toBe(true);
    expect(canAccessPath(admin, '/buildings')).toBe(true);
    expect(canAccessPath(admin, '/users')).toBe(true);
  });

  it('applies web sidebar role rules', () => {
    const admin = user('USER', ['Admin']);
    const owner = user('USER', ['Owner']);
    const roomer = user('USER', ['Roomer']);

    expect(canAccessPath(admin, '/buildings')).toBe(true);
    expect(canAccessPath(admin, '/users')).toBe(true);
    expect(canAccessPath(owner, '/buildings')).toBe(true);
    expect(canAccessPath(owner, '/users')).toBe(false);
    expect(canAccessPath(roomer, '/expenses')).toBe(true);
    expect(canAccessPath(roomer, '/buildings')).toBe(false);
    expect(canAccessPath(roomer, '/roles')).toBe(false);
  });

  it('allows routes without role requirements to every signed-in user', () => {
    const plain = user('USER');
    expect(canAccessPath(plain, '/chat')).toBe(true);
    expect(canAccessPath(plain, '/profile')).toBe(true);
    expect(canAccessPath(plain, '/expenses')).toBe(false);
  });

  it('reports building roles without duplicates', () => {
    const member = user('USER', ['Owner', 'Owner', 'Roomer']);
    expect(buildingRoles(member)).toEqual(['Owner', 'Roomer']);
    expect(hasBuildingRole(member, 'owner')).toBe(true);
    expect(hasBuildingRole(member, 'admin')).toBe(false);
  });
});
