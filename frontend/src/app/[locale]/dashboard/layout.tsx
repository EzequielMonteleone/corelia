import AuthGuard from '@/components/auth/auth-guard';
import Sidebar from '@/components/dashboard/Sidebar';
import {ReactNode} from 'react';

export default function DashboardLayout({children}: {children: ReactNode}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
