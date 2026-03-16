'use client';

import {useCallback, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Receipt, Plus, Trash2, ChevronRight, CalendarDays} from 'lucide-react';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {useBuildings} from '@/hooks/useBuildings';
import {
  useExpensePeriods,
  useCreateExpensePeriod,
  useDeleteExpensePeriod,
} from '@/hooks/useExpenses';
import {useAuthStore} from '@/store/authStore';
import type {ExpensePeriod} from '@/types/expense';

export default function ExpensesPage() {
  const t = useTranslations('Expenses');

  const user = useAuthStore(state => state.user);
  const isSuperAdmin = user?.globalRole === 'SUPERADMIN';

  const {data: buildings = [], isLoading: loadingBuildings} = useBuildings();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [newPeriod, setNewPeriod] = useState('');
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);

  const activeBuildingId = useMemo(
    () => selectedBuildingId || (buildings.length === 1 ? buildings[0].id : ''),
    [buildings, selectedBuildingId],
  );

  const canManagePeriods = useMemo(
    () =>
      isSuperAdmin ||
      (!!activeBuildingId &&
        user?.buildingUsers?.some(
          bu => bu.buildingId === activeBuildingId && bu.role?.name === 'Admin',
        )),
    [activeBuildingId, isSuperAdmin, user?.buildingUsers],
  );

  const {data: periods = [], isLoading: loadingPeriods} = useExpensePeriods(
    activeBuildingId || null,
  );
  const createPeriod = useCreateExpensePeriod();
  const deletePeriod = useDeleteExpensePeriod();

  const handleCreatePeriod = useCallback(() => {
    if (!activeBuildingId || !newPeriod.trim()) return;
    createPeriod.mutate(
      {buildingId: activeBuildingId, period: newPeriod.trim()},
      {
        onSuccess: () => {
          setNewPeriod('');
          setShowNewPeriodForm(false);
        },
      },
    );
  }, [activeBuildingId, createPeriod, newPeriod]);

  const handleDeletePeriod = useCallback(
    (period: ExpensePeriod) => {
      if (!confirm(t('deletePeriodConfirm'))) return;
      deletePeriod.mutate({periodId: period.id, buildingId: period.buildingId});
    },
    [deletePeriod, t],
  );

  const isLoading = loadingBuildings || (!!activeBuildingId && loadingPeriods);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        {(isSuperAdmin || buildings.length > 1) && (
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
            value={selectedBuildingId}
            onChange={e => setSelectedBuildingId(e.target.value)}>
            <option value="" className="bg-[#121212]">
              {t('selectBuilding')}
            </option>
            {buildings.map(b => (
              <option key={b.id} value={b.id} className="bg-[#121212]">
                {b.name}
              </option>
            ))}
          </select>
        )}
      </PageHeader>

      {isLoading ? (
        <LoadingState message={t('loading')} />
      ) : !activeBuildingId ? (
        <Card className="p-8 text-center">
          <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('selectBuilding')}</p>
        </Card>
      ) : (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {buildings.find(b => b.id === activeBuildingId)?.name}
            </h2>
            {canManagePeriods && (
              <Button size="sm" onClick={() => setShowNewPeriodForm(v => !v)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('newPeriod')}
              </Button>
            )}
          </div>

          {showNewPeriodForm && (
            <Card className="p-4 mb-4">
              <div className="flex gap-3">
                <Input
                  placeholder={t('periodPlaceholder')}
                  value={newPeriod}
                  onChange={e => setNewPeriod(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePeriod()}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreatePeriod}
                  disabled={!newPeriod.trim() || createPeriod.isPending}>
                  {t('createPeriod')}
                </Button>
              </div>
            </Card>
          )}

          {periods.length === 0 ? (
            <Card className="p-8 text-center">
              <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('noPeriods')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {periods.map(period => (
                <Card
                  key={period.id}
                  className="p-4 flex items-center justify-between gap-4 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                      <Receipt className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold">
                        {period.period}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('generatedAt')}:{' '}
                        {new Date(period.generatedAt).toLocaleDateString()}
                        {period._count !== undefined && (
                          <span className="ml-2">
                            · {period._count.expenses}{' '}
                            {period._count.expenses === 1
                              ? 'expensa'
                              : 'expensas'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      intent={period.status === 'OPEN' ? 'success' : 'default'}>
                      {period.status === 'OPEN'
                        ? t('statusOpen')
                        : t('statusClosed')}
                    </Badge>
                    {canManagePeriods && (
                      <Button
                        intent="ghost"
                        size="icon"
                        className="hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => handleDeletePeriod(period)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Link href={`/dashboard/expenses/${period.id}`}>
                      <Button intent="ghost" size="icon">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
