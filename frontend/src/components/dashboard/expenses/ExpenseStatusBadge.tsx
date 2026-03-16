'use client';

import {CheckCircle2, Clock, XCircle} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Badge} from '@/components/ui/Badge';
import type {ExpenseStatus} from '@/types/expense';

interface ExpenseStatusBadgeProps {
  status: ExpenseStatus;
  /** When true and status is PENDING, shows "Awaiting approval" instead of "Pending" */
  hasPaymentsAwaitingApproval?: boolean;
}

const statusConfig: Record<
  ExpenseStatus,
  {intent: 'success' | 'warning' | 'danger'; Icon: typeof CheckCircle2; key: string}
> = {
  PAID: {intent: 'success', Icon: CheckCircle2, key: 'statusPaid'},
  PENDING: {intent: 'warning', Icon: Clock, key: 'statusPending'},
  UNPAID: {intent: 'danger', Icon: XCircle, key: 'statusUnpaid'},
};

export const ExpenseStatusBadge = ({
  status,
  hasPaymentsAwaitingApproval = false,
}: ExpenseStatusBadgeProps) => {
  const t = useTranslations('Expenses');
  const {intent, Icon, key} = statusConfig[status];
  const labelKey =
    status === 'PENDING' && hasPaymentsAwaitingApproval
      ? 'paymentAwaitingApproval'
      : key;
  return (
    <Badge intent={intent} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {t(labelKey)}
    </Badge>
  );
};
