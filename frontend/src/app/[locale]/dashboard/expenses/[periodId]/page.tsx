'use client';

import {useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {Modal} from '@/components/ui/Modal';
import {
  useExpensePeriodDetail,
  useUpdateExpensePeriod,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCreatePayment,
} from '@/hooks/useExpenses';
import {useBuildingUnits} from '@/hooks/useBuildings';
import {useAuthStore} from '@/store/authStore';
import type {Expense} from '@/types/expense';

interface PaymentModalProps {
  expense: Expense | null;
  periodId: string;
  onClose: () => void;
}

function ExpenseStatusBadge({status}: {status: Expense['status']}) {
  const t = useTranslations('Expenses');
  if (status === 'PAID') {
    return (
      <Badge intent="success" className="flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {t('statusPaid')}
      </Badge>
    );
  }
  if (status === 'PARTIAL') {
    return (
      <Badge intent="warning" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {t('statusPartial')}
      </Badge>
    );
  }
  return (
    <Badge intent="default" className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {t('statusPending')}
    </Badge>
  );
}

function PaymentModal({expense, periodId, onClose}: PaymentModalProps) {
  const t = useTranslations('Expenses');
  const createPayment = useCreatePayment();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [externalPaymentId, setExternalPaymentId] = useState('');

  if (!expense) return null;

  const totalPaid = expense.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const remaining = Math.max(0, expense.amount - totalPaid);

  function handleSubmit() {
    const parsedAmount = parseFloat(amount);
    if (!expense || isNaN(parsedAmount) || parsedAmount <= 0) return;
    createPayment.mutate(
      {
        expenseId: expense.id,
        periodId,
        amount: parsedAmount,
        paymentMethod: paymentMethod.trim() || undefined,
        externalPaymentId: externalPaymentId.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAmount('');
          setPaymentMethod('');
          setExternalPaymentId('');
          onClose();
        },
      },
    );
  }

  return (
    <Modal isOpen={!!expense} onClose={onClose} title={t('registerPayment')}>
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-gray-400">{t('unit')}</p>
          <p className="text-white font-semibold">
            {expense.unit.name}
            {expense.unit.floor ? ` · ${t('unit')} ${expense.unit.floor}` : ''}
          </p>
          <div className="flex gap-6 mt-2">
            <div>
              <p className="text-xs text-gray-500">{t('amount')}</p>
              <p className="text-white font-medium">
                ${expense.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('totalPaid')}</p>
              <p className="text-green-400 font-medium">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('remaining')}</p>
              <p
                className={
                  remaining > 0
                    ? 'text-yellow-400 font-medium'
                    : 'text-green-400 font-medium'
                }>
                ${remaining.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {expense.payments.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {t('payments')}
            </p>
            {expense.payments.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  {p.paymentMethod || '—'}
                  {p.externalPaymentId ? ` · ${p.externalPaymentId}` : ''}
                </span>
                <span className="text-white font-medium">
                  ${p.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-white/10 pt-4 space-y-3">
          <Input
            type="number"
            placeholder={t('paymentAmount')}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min={0}
            step={0.01}
          />
          <Input
            placeholder={t('paymentMethodPlaceholder')}
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
          />
          <Input
            placeholder={t('externalPaymentIdPlaceholder')}
            value={externalPaymentId}
            onChange={e => setExternalPaymentId(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={
              !amount || parseFloat(amount) <= 0 || createPayment.isPending
            }>
            <CreditCard className="w-4 h-4 mr-2" />
            {t('confirmPayment')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ExpensePeriodDetailPage() {
  const params = useParams();
  const periodId = params?.periodId as string;
  const user = useAuthStore(state => state.user);
  const isSuperAdmin = user?.globalRole === 'SUPERADMIN';

  const t = useTranslations('Expenses');
  const tCommon = useTranslations('Common');

  const {data: period, isLoading, isError} = useExpensePeriodDetail(periodId);
  const {data: units = []} = useBuildingUnits(period?.building.id ?? null);

  const canManagePeriods = useMemo(
    () =>
      isSuperAdmin ||
      (!!period?.building.id &&
        user?.buildingUsers?.some(
          bu =>
            bu.buildingId === period.building.id && bu.role?.name === 'Admin',
        )),
    [isSuperAdmin, period, user?.buildingUsers],
  );

  const updatePeriod = useUpdateExpensePeriod();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

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

  const unitsWithExpense = new Set(period.expenses.map(e => e.unitId));
  const availableUnits = units.filter(u => !unitsWithExpense.has(u.id));

  function handleAddExpense() {
    if (!selectedUnitId || !newAmount) return;
    const amount = parseFloat(newAmount);
    if (isNaN(amount)) return;
    createExpense.mutate(
      {periodId, unitId: selectedUnitId, amount},
      {
        onSuccess: () => {
          setSelectedUnitId('');
          setNewAmount('');
        },
      },
    );
  }

  function handleTogglePeriodStatus() {
    updatePeriod.mutate({
      periodId,
      status: isOpen ? 'CLOSED' : 'OPEN',
    });
  }

  function handleStartEdit(expense: Expense) {
    setEditingExpenseId(expense.id);
    setEditAmount(String(expense.amount));
  }

  function handleSaveEdit(expense: Expense) {
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) return;
    updateExpense.mutate(
      {expenseId: expense.id, periodId, amount},
      {
        onSuccess: () => {
          setEditingExpenseId(null);
          setEditAmount('');
        },
      },
    );
  }

  function handleDeleteExpense(expense: Expense) {
    if (!confirm(t('deleteExpenseConfirm'))) return;
    deleteExpense.mutate({expenseId: expense.id, periodId});
  }

  const totalAmount = period.expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = period.expenses.reduce(
    (s, e) =>
      s +
      e.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((ps, p) => ps + p.amount, 0),
    0,
  );
  const totalPending = totalAmount - totalPaid;

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

      {/* Period header */}
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
            <div className="flex items-center gap-3">
              <Button
                intent="outline"
                onClick={handleTogglePeriodStatus}
                disabled={updatePeriod.isPending}>
                {isOpen ? t('closePeriod') : t('reopenPeriod')}
              </Button>
            </div>
          )}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('amount')}
            </p>
            <p className="text-xl font-bold text-white">
              ${totalAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('totalPaid')}
            </p>
            <p className="text-xl font-bold text-green-400">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('remaining')}
            </p>
            <p
              className={`text-xl font-bold ${totalPending > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              ${totalPending.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Add expense row (solo si tiene permiso para crear expensas) */}
      {canManagePeriods && isOpen && availableUnits.length > 0 && (
        <Card className="p-4 max-w-4xl mb-4">
          <div className="flex gap-3">
            <select
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              value={selectedUnitId}
              onChange={e => setSelectedUnitId(e.target.value)}>
              <option value="" className="bg-[#121212]">
                {t('selectUnit')}
              </option>
              {availableUnits.map(u => (
                <option key={u.id} value={u.id} className="bg-[#121212]">
                  {u.name}
                  {u.floor ? ` (${u.floor})` : ''}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder={t('amountPlaceholder')}
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              min={0}
              step={0.01}
              className="w-36"
            />
            <Button
              onClick={handleAddExpense}
              disabled={
                !selectedUnitId || !newAmount || createExpense.isPending
              }>
              <Plus className="w-4 h-4 mr-2" />
              {t('addExpense')}
            </Button>
          </div>
        </Card>
      )}

      {/* Expenses table */}
      <Card className="max-w-4xl overflow-hidden">
        {period.expenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">{t('noExpenses')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                  {t('unit')}
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                  {t('amount')}
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                  {t('totalPaid')}
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                  {t('status')}
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {period.expenses.map(expense => {
                const paidForExpense = expense.payments
                  .filter(p => p.status === 'COMPLETED')
                  .reduce((s, p) => s + p.amount, 0);
                const isEditing = editingExpenseId === expense.id;

                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        {expense.unit.name}
                      </p>
                      {expense.unit.floor && (
                        <p className="text-xs text-gray-500">
                          Piso {expense.unit.floor}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            className="w-28 text-right"
                            min={0}
                            step={0.01}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(expense)}
                            disabled={updateExpense.isPending}>
                            OK
                          </Button>
                          <Button
                            size="sm"
                            intent="ghost"
                            onClick={() => setEditingExpenseId(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <span className="text-white font-medium">
                          ${expense.amount.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-400 font-medium">
                        ${paidForExpense.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ExpenseStatusBadge status={expense.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {isOpen && (
                          <>
                            {canManagePeriods && (
                              <>
                                <Button
                                  intent="ghost"
                                  size="icon"
                                  onClick={() => handleStartEdit(expense)}
                                  title={t('editAmount')}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  intent="ghost"
                                  size="icon"
                                  className="hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => handleDeleteExpense(expense)}
                                  title={t('deleteExpense')}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              intent="ghost"
                              size="icon"
                              onClick={() => setPaymentExpense(expense)}
                              title={t('registerPayment')}>
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {!isOpen && expense.status !== 'PAID' && (
                          <Button
                            intent="ghost"
                            size="icon"
                            onClick={() => setPaymentExpense(expense)}
                            title={t('registerPayment')}>
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <PaymentModal
        expense={paymentExpense}
        periodId={periodId}
        onClose={() => setPaymentExpense(null)}
      />
    </div>
  );
}
