'use client';

import {CreditCard, Pencil, Trash2} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useLocale} from 'next-intl';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {ExpenseStatusBadge} from './ExpenseStatusBadge';
import type {Expense} from '@/types/expense';
import {formatCurrency} from '@/lib/utils';

interface ExpensesTableProps {
  expenses: Expense[];
  isOpen: boolean;
  canManagePeriods: boolean;
  editingExpenseId: string | null;
  editAmount: string;
  paymentButtonTitle: string;
  onEditAmountChange: (value: string) => void;
  onStartEdit: (expense: Expense) => void;
  onSaveEdit: (expense: Expense) => void;
  onCancelEdit: () => void;
  onDeleteExpense: (expense: Expense) => void;
  onOpenPayment: (expense: Expense) => void;
  isUpdatePending: boolean;
}

export const ExpensesTable = ({
  expenses,
  isOpen,
  canManagePeriods,
  editingExpenseId,
  editAmount,
  paymentButtonTitle,
  onEditAmountChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteExpense,
  onOpenPayment,
  isUpdatePending,
}: ExpensesTableProps) => {
  const t = useTranslations('Expenses');
  const locale = useLocale();

  if (expenses.length === 0) {
    return (
      <Card className="max-w-4xl overflow-hidden">
        <div className="p-8 text-center">
          <p className="text-gray-400">{t('noExpenses')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl overflow-hidden">
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
          {expenses.map(expense => {
            const paidForExpense = expense.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((s, p) => s + p.amount, 0);
            const isEditing = editingExpenseId === expense.id;

            return (
              <tr
                key={expense.id}
                className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{expense.unit.name}</p>
                  {expense.unit.floor && (
                    <p className="text-xs text-gray-500">
                      {t('floor')} {expense.unit.floor}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={e => onEditAmountChange(e.target.value)}
                        className="w-28 text-right"
                        min={0.01}
                        step={0.01}
                      />
                      <Button
                        size="sm"
                        onClick={() => onSaveEdit(expense)}
                        disabled={isUpdatePending || parseFloat(editAmount) <= 0}>
                        OK
                      </Button>
                      <Button size="sm" intent="ghost" onClick={onCancelEdit}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <span className="text-white font-medium">
                      {formatCurrency(expense.amount, locale)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-green-400 font-medium">
                    {formatCurrency(paidForExpense, locale)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <ExpenseStatusBadge
                    status={expense.status}
                    hasPaymentsAwaitingApproval={expense.payments.some(
                      p => p.status === 'PENDING',
                    )}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {isOpen && (
                      <>
                        {canManagePeriods && expense.status !== 'PAID' && (
                          <>
                            <Button
                              intent="ghost"
                              size="icon"
                              onClick={() => onStartEdit(expense)}
                              title={t('editAmount')}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              intent="ghost"
                              size="icon"
                              className="hover:bg-red-500/10 hover:text-red-400"
                              onClick={() => onDeleteExpense(expense)}
                              title={t('deleteExpense')}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          intent="ghost"
                          size="icon"
                          onClick={() => onOpenPayment(expense)}
                          title={paymentButtonTitle}>
                          <CreditCard className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {!isOpen && expense.status !== 'PAID' && (
                      <Button
                        intent="ghost"
                        size="icon"
                        onClick={() => onOpenPayment(expense)}
                        title={paymentButtonTitle}>
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
    </Card>
  );
};
