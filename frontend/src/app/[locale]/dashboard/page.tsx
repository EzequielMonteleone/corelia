'use client';

import {useMemo, useState} from 'react';
import {useAuthStore} from '@/store/authStore';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {useBuildings} from '@/hooks/useBuildings';
import {useCollectionSummary} from '@/hooks/useExpenses';

export default function DashboardPage() {
  const {user, logout} = useAuthStore();
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const tExpenses = useTranslations('Expenses');
  const {data: buildings = []} = useBuildings();
  const isSuperAdmin = user?.globalRole === 'SUPERADMIN';
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const activeBuildingId = useMemo(
    () => selectedBuildingId || (buildings.length === 1 ? buildings[0].id : null),
    [buildings, selectedBuildingId],
  );

  const {data: summary} = useCollectionSummary(activeBuildingId);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    [],
  );

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
          <div className="flex items-center gap-3">
            {(isSuperAdmin || buildings.length > 1) && (
              <select
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                value={selectedBuildingId}
                onChange={e => setSelectedBuildingId(e.target.value)}>
                <option value="" className="bg-[#121212]">
                  {tExpenses('selectBuilding')}
                </option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id} className="bg-[#121212]">
                    {building.name}
                  </option>
                ))}
              </select>
            )}
            <Button intent="destructive" onClick={logout}>
              {tCommon('logout')}
            </Button>
          </div>
        </header>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <p className="text-gray-400 text-sm">{t('kpiDebt')}</p>
              <p className="text-2xl font-semibold text-red-300">
                {currency.format(summary.debtTotal)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-gray-400 text-sm">{t('kpiCollected')}</p>
              <p className="text-2xl font-semibold text-emerald-300">
                {currency.format(summary.totalPaid)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-gray-400 text-sm">{t('kpiCollectionRate')}</p>
              <p className="text-2xl font-semibold text-blue-300">
                {summary.collectionRate.toFixed(1)}%
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-gray-400 text-sm">{t('kpiUnitsWithDebt')}</p>
              <p className="text-2xl font-semibold text-yellow-300">
                {summary.unitsWithDebtCount}
              </p>
            </Card>
          </div>
        )}

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
          <Link href="/dashboard/expenses">
            <Card className="p-6 hover:border-purple-500/50 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400">
                {t('paymentsCard')}
              </h3>
              <p className="text-gray-400 text-sm">{t('paymentsCardDesc')}</p>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
