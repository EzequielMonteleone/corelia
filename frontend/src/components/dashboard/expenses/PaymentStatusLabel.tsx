'use client';

import {useTranslations} from 'next-intl';
import type {PaymentStatus} from '@/types/expense';

interface PaymentStatusLabelProps {
  status: PaymentStatus;
}

const statusKey: Record<PaymentStatus, string> = {
  COMPLETED: 'paymentApproved',
  REJECTED: 'paymentRejected',
  PENDING: 'paymentAwaitingApproval',
  FAILED: 'paymentRejected',
};

const statusClass: Record<PaymentStatus, string> = {
  COMPLETED: 'text-green-400',
  REJECTED: 'text-red-400',
  PENDING: 'text-amber-400',
  FAILED: 'text-red-400',
};

export const PaymentStatusLabel = ({status}: PaymentStatusLabelProps) => {
  const t = useTranslations('Expenses');
  return (
    <span className={statusClass[status]}>{t(statusKey[status])}</span>
  );
};
