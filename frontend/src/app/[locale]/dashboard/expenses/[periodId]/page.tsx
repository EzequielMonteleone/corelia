'use client';

import {useParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {
  PeriodHeaderCard,
  AddExpenseForm,
  ExpensesTable,
  PaymentModal,
} from '@/components/dashboard/expenses';
import {useExpensePeriodPage} from '@/hooks/useExpenses';
import type {Expense} from '@/types/expense';
import {useCallback, useMemo, useState} from 'react';
import {toast} from 'sonner';

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
    deleteExpense,
    updatePeriod,
    createExpense,
    updateExpense,
  } = useExpensePeriodPage(periodId);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const handleDeleteWithConfirm = useCallback(
    (expense: Expense) => {
      setExpenseToDelete(expense);
    },
    [],
  );

  const handleConfirmDeleteExpense = useCallback(() => {
    if (!expenseToDelete) return;
    handleDeleteExpense(expenseToDelete, {
      onSuccess: () => {
        setExpenseToDelete(null);
        toast.success(t('deleteExpenseSuccess'));
      },
      onError: () => toast.error(t('deleteExpenseError')),
    });
  }, [expenseToDelete, handleDeleteExpense, t]);

  const handleAddExpenseWithToast = useCallback(() => {
    handleAddExpense({
      onSuccess: () => toast.success(t('addExpenseSuccess')),
      onError: () => toast.error(t('addExpenseError')),
    });
  }, [handleAddExpense, t]);

  const handleTogglePeriodStatusWithToast = useCallback(() => {
    handleTogglePeriodStatus({
      onSuccess: () => toast.success(t('periodStatusUpdateSuccess')),
      onError: () => toast.error(t('periodStatusUpdateError')),
    });
  }, [handleTogglePeriodStatus, t]);

  const handleSaveEditWithToast = useCallback(
    (expense: Expense) => {
      handleSaveEdit(expense, {
        onSuccess: () => toast.success(t('editExpenseSuccess')),
        onError: () => toast.error(t('editExpenseError')),
      });
    },
    [handleSaveEdit, t],
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
        onToggleStatus={handleTogglePeriodStatusWithToast}
        isTogglePending={updatePeriod.isPending}
      />

      {canManagePeriods && isOpen && (
        <AddExpenseForm
          availableUnits={availableUnits}
          selectedUnitId={selectedUnitId}
          newAmount={newAmount}
          onUnitChange={setSelectedUnitId}
          onAmountChange={setNewAmount}
          onSubmit={handleAddExpenseWithToast}
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
        onSaveEdit={handleSaveEditWithToast}
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

      <ConfirmDialog
        isOpen={!!expenseToDelete}
        title={t('deleteExpense')}
        description={t('deleteExpenseConfirm')}
        confirmLabel={tCommon('confirm')}
        cancelLabel={tCommon('cancel')}
        isPending={deleteExpense.isPending}
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDeleteExpense}
      />
    </div>
  );
};

export default ExpensePeriodDetailPage;
