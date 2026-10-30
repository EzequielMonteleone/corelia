import type {UserData} from '@/types/user';

export type NavRule = {
  href: string;
  roles?: readonly string[];
  justSuperAdmin?: boolean;
};

/** Same sections as the sidebar, in menu order. */
export const navRules: readonly NavRule[] = [
  {href: '/dashboard', roles: ['admin']},
  {href: '/dashboard/chat'},
  {href: '/dashboard/buildings', roles: ['admin', 'owner']},
  {href: '/dashboard/users', roles: ['admin']},
  {href: '/dashboard/expenses', roles: ['admin', 'owner', 'roomer']},
  {href: '/dashboard/amenities', roles: ['admin', 'owner', 'roomer']},
  {href: '/dashboard/household', roles: ['admin', 'owner', 'roomer']},
  {href: '/dashboard/claims', roles: ['admin', 'owner', 'roomer']},
  {href: '/dashboard/profile'},
  {href: '/dashboard/roles', justSuperAdmin: true},
];

type NavUser = Pick<UserData, 'globalRole' | 'buildingUsers'> | null;

function matchesPath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ruleForPath(pathname: string): NavRule | null {
  const matches = navRules.filter(rule => matchesPath(pathname, rule.href));
  if (matches.length === 0) return null;
  return matches.reduce((best, rule) =>
    rule.href.length > best.href.length ? rule : best,
  );
}

function canAccessRule(user: NavUser, rule: NavRule) {
  if (rule.justSuperAdmin) return user?.globalRole === 'SUPERADMIN';
  if (user?.globalRole === 'SUPERADMIN') return true;
  if (!rule.roles) return true;
  return (
    user?.buildingUsers?.some(membership =>
      rule.roles?.includes(membership.role?.name.toLowerCase() || ''),
    ) ?? false
  );
}

/** Known sections without permission are blocked. Anything else stays a Next 404. */
export function canAccessPath(user: NavUser, pathname: string) {
  const rule = ruleForPath(pathname);
  if (!rule) return true;
  return canAccessRule(user, rule);
}

export function firstAccessiblePath(user: NavUser) {
  return (
    navRules.find(rule => canAccessRule(user, rule))?.href ?? '/dashboard/chat'
  );
}
