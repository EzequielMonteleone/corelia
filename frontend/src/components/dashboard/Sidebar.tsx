'use client';

import {Link, usePathname} from '@/i18n/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  LogOut,
  CircleUser,
  Receipt,
  CalendarDays,
  MessageSquare,
  Home,
  ClipboardList,
} from 'lucide-react';
import {useAuthStore} from '@/store/authStore';
import {canAccessPath} from '@/lib/navAccess';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/Button';
import {useTranslations} from 'next-intl';
import {BrandLogo} from '@/components/brand/BrandLogo';
import {LocaleSwitcher} from '@/components/i18n/LocaleSwitcher';

function useMenuItems() {
  const tCommon = useTranslations('Common');
  const tSidebar = useTranslations('Sidebar');
  return [
    {
      icon: LayoutDashboard,
      label: tCommon('dashboard'),
      href: '/dashboard',
    },
    {
      icon: MessageSquare,
      label: tSidebar('chat'),
      href: '/dashboard/chat',
    },
    {
      icon: Building2,
      label: tCommon('buildings'),
      href: '/dashboard/buildings',
    },
    {
      icon: Users,
      label: tCommon('users'),
      href: '/dashboard/users',
    },
    {
      icon: Receipt,
      label: tSidebar('expenses'),
      href: '/dashboard/expenses',
    },
    {
      icon: CalendarDays,
      label: tSidebar('amenities'),
      href: '/dashboard/amenities',
    },
    {
      icon: Home,
      label: tSidebar('household'),
      href: '/dashboard/household',
    },
    {
      icon: ClipboardList,
      label: tSidebar('claims'),
      href: '/dashboard/claims',
    },
    {
      icon: CircleUser,
      label: tSidebar('profile'),
      href: '/dashboard/profile',
    },
    {
      icon: ShieldCheck,
      label: tSidebar('rolesAndPermissions'),
      href: '/dashboard/roles',
    },
  ];
}

export default function Sidebar() {
  const pathname = usePathname();
  const {logout} = useAuthStore();
  const user = useAuthStore(state => state.user);
  const menuItems = useMenuItems();
  const tCommon = useTranslations('Common');

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-7 pb-2">
        <BrandLogo />
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems
          .filter(item => canAccessPath(user, item.href))
          .map(item => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                )}>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-400' : 'group-hover:text-white',
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <LocaleSwitcher className="w-full" />
        <Button
          intent="destructive"
          onClick={logout}
          className="group justify-start gap-3 w-full py-6 bg-transparent hover:bg-red-500/10">
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">{tCommon('logout')}</span>
        </Button>
      </div>
    </aside>
  );
}
