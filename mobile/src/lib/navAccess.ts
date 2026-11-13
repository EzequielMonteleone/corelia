import type {UserData} from '@/types/user';

export type NavRule = {
  href: string;
  roles?: readonly string[];
  justSuperAdmin?: boolean;
};

type NavUser = Pick<UserData, 'globalRole' | 'buildingUsers'> | null;

/** Same access rules as the web sidebar. */
export const navRules: readonly NavRule[] = [
  {href: '/', roles: ['admin']},
  {href: '/chat'},
  {href: '/buildings', roles: ['admin', 'owner']},
  {href: '/users', roles: ['admin']},
  {href: '/expenses', roles: ['admin', 'owner', 'roomer']},
  {href: '/amenities', roles: ['admin', 'owner', 'roomer']},
  {href: '/household', roles: ['admin', 'owner', 'roomer']},
  {href: '/claims', roles: ['admin', 'owner', 'roomer']},
  {href: '/documents', roles: ['admin', 'owner', 'roomer']},
  {href: '/profile'},
  {href: '/roles', justSuperAdmin: true},
];

export function canAccessRule(user: NavUser, rule: NavRule) {
  if (rule.justSuperAdmin) return user?.globalRole === 'SUPERADMIN';
  if (user?.globalRole === 'SUPERADMIN') return true;
  if (!rule.roles) return true;
  return (
    user?.buildingUsers?.some(membership =>
      rule.roles?.includes(membership.role?.name.toLowerCase() || ''),
    ) ?? false
  );
}

export function canAccessPath(user: NavUser, href: string) {
  const rule = navRules.find(item => item.href === href);
  if (!rule) return true;
  return canAccessRule(user, rule);
}

export function isSuperAdmin(user: NavUser) {
  return user?.globalRole === 'SUPERADMIN';
}

export function buildingRoles(user: NavUser): string[] {
  if (!user?.buildingUsers) return [];
  return Array.from(
    new Set(
      user.buildingUsers
        .map(membership => membership.role?.name)
        .filter((role): role is string => Boolean(role)),
    ),
  );
}

export function hasBuildingRole(user: NavUser, ...roles: string[]) {
  if (isSuperAdmin(user)) return true;
  const normalized = roles.map(role => role.toLowerCase());
  return (
    user?.buildingUsers?.some(membership =>
      normalized.includes(membership.role?.name.toLowerCase() ?? ''),
    ) ?? false
  );
}
