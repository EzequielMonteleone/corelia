'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import {useAuthStore} from '@/store/authStore';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/Button';

const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['admin'],
  },
  {
    icon: Building2,
    label: 'Edificios',
    href: '/dashboard/buildings',
    roles: ['admin'],
  },
  {icon: Users, label: 'Usuarios', href: '/dashboard/users', roles: ['admin']},
  {
    icon: ShieldCheck,
    label: 'Roles y Permisos',
    href: '/dashboard/roles',
    justSuperAdmin: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const {logout} = useAuthStore();
  const user = useAuthStore(state => state.user);

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Corelia
        </h2>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map(item => {
          const isActive = pathname === item.href;
          const isSuperAdmin = user?.globalRole === 'SUPERADMIN';

          if (item.justSuperAdmin && !isSuperAdmin) return null;

          if (item.roles && !isSuperAdmin) {
            const hasRequiredRole = user?.buildingUsers?.some(bu =>
              item.roles?.includes(bu.role?.name.toLowerCase() || ''),
            );
            if (!hasRequiredRole) return null;
          }

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

      <div className="p-4 border-t border-white/10">
        <Button
          intent="destructive"
          onClick={logout}
          className="group justify-start gap-3 w-full py-6 bg-transparent hover:bg-red-500/10">
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Cerrar Sesión</span>
        </Button>
      </div>
    </aside>
  );
}
