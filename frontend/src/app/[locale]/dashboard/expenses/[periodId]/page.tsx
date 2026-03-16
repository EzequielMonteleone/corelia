'use client';

import {useParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {
  PeriodHeaderCard,
  AddExpenseForm,
  ExpensesTable,
  PaymentModal,
} from '@/components/dashboard/expenses';
import {useExpensePeriodPage} from '@/hooks/useExpenses';
import type {Expense} from '@/types/expense';
import {useCallback, useMemo} from 'react';

const ExpensePeriodDetailPage = () => {
  const params = useParams();
  const periodId = (params?.periodId as string) ?? '';
  const t = useTranslations('Expenses');
  const tCommon = useTranslations('Common');

  const {
    period,
    isLoading,
    isError,
    canManagePeriods,
    availableUnits,
    selectedUnitId,
    setSelectedUnitId,
    newAmount,
    setNewAmount,
    paymentExpense,
    setPaymentExpense,
    editingExpenseId,
    editAmount,
    setEditAmount,
    handleAddExpense,
    handleTogglePeriodStatus,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteExpense,
    updatePeriod,
    createExpense,
    updateExpense,
  } = useExpensePeriodPage(periodId);

  const handleDeleteWithConfirm = useCallback(
    (expense: Expense) => {
      if (!confirm(t('deleteExpenseConfirm'))) return;
      handleDeleteExpense(expense);
    },
    [handleDeleteExpense, t],
  );

  const paymentButtonTitle = useMemo(
    () => (canManagePeriods ? t('registerPayment') : t('notifyPaid')),
    [canManagePeriods, t],
  );
  const paymentConfirmLabel = useMemo(
    () => (canManagePeriods ? t('confirmPayment') : t('notifyPaid')),
    [canManagePeriods, t],
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingState message={t('loading')} />
      </div>
    );
  }

  if (isError || !period) {
    return (
      <div className="p-8">
        <PageHeader title={t('title')} description={t('description')} />
        <Card className="p-8 text-center">
          <p className="text-gray-400 mb-4">{t('notFound')}</p>
          <Link
            href="/dashboard/expenses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('backToList')}
          </Link>
        </Card>
      </div>
    );
  }

  const isOpen = period.status === 'OPEN';

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {tCommon('back')}
        </Link>
      </PageHeader>

      <PeriodHeaderCard
        period={period}
        canManagePeriods={canManagePeriods}
        onToggleStatus={handleTogglePeriodStatus}
        isTogglePending={updatePeriod.isPending}
      />

      {canManagePeriods && isOpen && (
        <AddExpenseForm
          availableUnits={availableUnits}
          selectedUnitId={selectedUnitId}
          newAmount={newAmount}
          onUnitChange={setSelectedUnitId}
          onAmountChange={setNewAmount}
          onSubmit={handleAddExpense}
          isPending={createExpense.isPending}
        />
      )}

      <ExpensesTable
        expenses={period.expenses}
        isOpen={isOpen}
        canManagePeriods={canManagePeriods}
        editingExpenseId={editingExpenseId}
        editAmount={editAmount}
        paymentButtonTitle={paymentButtonTitle}
        onEditAmountChange={setEditAmount}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDeleteExpense={handleDeleteWithConfirm}
        onOpenPayment={setPaymentExpense}
        isUpdatePending={updateExpense.isPending}
      />

      <PaymentModal
        expense={paymentExpense}
        periodId={periodId}
        onClose={() => setPaymentExpense(null)}
        modalTitle={paymentButtonTitle}
        confirmButtonLabel={paymentConfirmLabel}
        canManagePeriods={canManagePeriods}
      />
    </div>
  );
};

export default ExpensePeriodDetailPage;
