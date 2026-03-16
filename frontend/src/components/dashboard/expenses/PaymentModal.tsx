'use client';

import {useState} from 'react';
import {CreditCard, Check, XCircle} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Modal} from '@/components/ui/Modal';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {PaymentStatusLabel} from './PaymentStatusLabel';
import {useCreatePayment, useUpdatePayment} from '@/hooks/useExpenses';
import type {Expense} from '@/types/expense';

export interface PaymentModalProps {
  expense: Expense | null;
  periodId: string;
  onClose: () => void;
  modalTitle: string;
  confirmButtonLabel: string;
  canManagePeriods: boolean;
}

export const PaymentModal = ({
  expense,
  periodId,
  onClose,
  modalTitle,
  confirmButtonLabel,
  canManagePeriods,
}: PaymentModalProps) => {
  const t = useTranslations('Expenses');
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [externalPaymentId, setExternalPaymentId] = useState('');

  if (!expense) return null;

  const totalPaid = expense.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, expense.amount - totalPaid);

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
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
  };

  const handleApprove = (paymentId: string) =>
    updatePayment.mutate({paymentId, periodId, status: 'COMPLETED'});

  const handleReject = (paymentId: string) =>
    updatePayment.mutate({paymentId, periodId, status: 'REJECTED'});

  return (
    <Modal isOpen={!!expense} onClose={onClose} title={modalTitle}>
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
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {t('payments')}
            </p>
            {expense.payments.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 text-sm py-2 px-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-300 truncate">
                    {p.paymentMethod || '—'}
                    {p.externalPaymentId ? ` · ${p.externalPaymentId}` : ''}
                  </span>
                  <PaymentStatusLabel status={p.status} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white font-medium">
                    ${p.amount.toFixed(2)}
                  </span>
                  {canManagePeriods && p.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        intent="ghost"
                        className="text-green-400 hover:bg-green-500/10"
                        onClick={() => handleApprove(p.id)}
                        disabled={updatePayment.isPending}
                        title={t('approvePayment')}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        intent="ghost"
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => handleReject(p.id)}
                        disabled={updatePayment.isPending}
                        title={t('rejectPayment')}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!canManagePeriods && (
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
              {confirmButtonLabel}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
