'use client';

import {useTranslations} from 'next-intl';
import {useLocale} from 'next-intl';
import {Card} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import type {ExpensePeriodDetail} from '@/types/expense';
import {useMemo} from 'react';
import {formatCurrency} from '@/lib/utils';

interface PeriodHeaderCardProps {
  period: ExpensePeriodDetail;
  canManagePeriods: boolean;
  onToggleStatus: () => void;
  isTogglePending: boolean;
}

export const PeriodHeaderCard = ({
  period,
  canManagePeriods,
  onToggleStatus,
  isTogglePending,
}: PeriodHeaderCardProps) => {
  const t = useTranslations('Expenses');
  const locale = useLocale();
  const isOpen = useMemo(() => period.status === 'OPEN', [period.status]);
  const totalAmount = useMemo(
    () => period.expenses.reduce((s, e) => s + e.amount, 0),
    [period.expenses],
  );

  const totalPaid = useMemo(
    () =>
      period.expenses.reduce(
        (s, e) =>
          s +
          e.payments
            .filter(p => p.status === 'COMPLETED')
            .reduce((ps, p) => ps + p.amount, 0),
        0,
      ),
    [period.expenses],
  );

  const totalPending = useMemo(
    () => totalAmount - totalPaid,
    [totalAmount, totalPaid],
  );

  return (
    <Card className="p-6 max-w-4xl mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{period.building.name}</p>
          <h2 className="text-2xl font-bold text-white mb-2">
            {period.period}
          </h2>
          <Badge intent={isOpen ? 'success' : 'default'}>
            {isOpen ? t('statusOpen') : t('statusClosed')}
          </Badge>
        </div>
        {canManagePeriods && (
          <Button
            intent="outline"
            onClick={onToggleStatus}
            disabled={isTogglePending}>
            {isOpen ? t('closePeriod') : t('reopenPeriod')}
          </Button>
        )}
      </div>
      <div className="mt-6 pt-6 border-t border-white/10">
        {!canManagePeriods && (
          <p className="text-sm text-gray-400 mb-4">{t('summaryMyUnit')}</p>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('amount')}
            </p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(totalAmount, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('totalPaid')}
            </p>
            <p className="text-xl font-bold text-green-400">
              {formatCurrency(totalPaid, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('remaining')}
            </p>
            <p
              className={`text-xl font-bold ${totalPending > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {formatCurrency(totalPending, locale)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
