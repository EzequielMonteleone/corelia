'use client';

import {useAuthStore} from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {useTranslations} from 'next-intl';

export default function DashboardPage() {
  const {user, logout} = useAuthStore();
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              {tCommon('title')} {tCommon('dashboard')}
            </h1>
            <p className="text-gray-400 mt-2">
              {t('welcome', {
                name: user ? `${user.firstName} ${user.lastName}` : '',
              })}
            </p>
          </div>
          <Button
            intent="destructive"
            onClick={logout}
          >
            {tCommon('logout')}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:border-blue-500/50 cursor-pointer">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400">
              {t('buildingsCard')}
            </h3>
            <p className="text-gray-400 text-sm">
              {t('buildingsCardDesc')}
            </p>
          </Card>
          <Card className="p-6 hover:border-indigo-500/50 cursor-pointer">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-400">
              {t('usersCard')}
            </h3>
            <p className="text-gray-400 text-sm">
              {t('usersCardDesc')}
            </p>
          </Card>
          <Card className="p-6 hover:border-purple-500/50 cursor-pointer">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400">
              {t('paymentsCard')}
            </h3>
            <p className="text-gray-400 text-sm">
              {t('paymentsCardDesc')}
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
