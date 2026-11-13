import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {
  useCreatePayment,
  useUpdatePaymentStatus,
} from '@/hooks/queries/useExpenses';
import {formatCurrency} from '@/lib/format';
import {toast} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';
import type {Expense, PaymentStatus} from '@/types/expense';
import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

const PAYMENT_STATUS: Record<
  PaymentStatus,
  {
    labelKey:
      | 'Expenses.paymentApproved'
      | 'Expenses.paymentAwaitingApproval'
      | 'Expenses.paymentRejected'
      | 'Expenses.paymentFailed';
    color: string;
  }
> = {
  COMPLETED: {labelKey: 'Expenses.paymentApproved', color: colors.success},
  PENDING: {
    labelKey: 'Expenses.paymentAwaitingApproval',
    color: colors.warning,
  },
  REJECTED: {labelKey: 'Expenses.paymentRejected', color: colors.danger},
  FAILED: {labelKey: 'Expenses.paymentFailed', color: colors.danger},
};

export function PaymentModal({
  expense,
  periodId,
  visible,
  canManagePeriods,
  onClose,
}: {
  expense: Expense | null;
  periodId: string;
  visible: boolean;
  canManagePeriods: boolean;
  onClose: () => void;
}) {
  const {t} = useTranslation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [externalId, setExternalId] = useState('');
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePaymentStatus();

  if (!expense) return null;

  const completed = expense.payments
    .filter(payment => payment.status === 'COMPLETED')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remaining =
    expense.remaining ?? Math.max(expense.amount - completed, 0);
  const parsedAmount = Number(amount);
  const canSubmit =
    !canManagePeriods &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= remaining;

  const submitPayment = () => {
    if (!canSubmit) return;
    createPayment.mutate(
      {
        expenseId: expense.id,
        periodId,
        amount: parsedAmount,
        ...(method.trim() ? {paymentMethod: method.trim()} : {}),
        ...(externalId.trim() ? {externalPaymentId: externalId.trim()} : {}),
      },
      {
        onSuccess: () => {
          toast.success(t('Expenses.paymentCreateSuccess'));
          onClose();
        },
        onError: () => toast.error(t('Expenses.paymentCreateError')),
      },
    );
  };

  const updateStatus = (
    paymentId: string,
    status: 'COMPLETED' | 'REJECTED',
  ) => {
    updatePayment.mutate(
      {paymentId, periodId, status},
      {
        onSuccess: () =>
          toast.success(
            t(
              status === 'COMPLETED'
                ? 'Expenses.paymentApproveSuccess'
                : 'Expenses.paymentRejectSuccess',
            ),
          ),
        onError: () =>
          toast.error(
            t(
              status === 'COMPLETED'
                ? 'Expenses.paymentApproveError'
                : 'Expenses.paymentRejectError',
            ),
          ),
      },
    );
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={
        canManagePeriods
          ? t('Expenses.registerPayment')
          : t('Expenses.notifyPaid')
      }>
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.unit}>
            {expense.unit.name}
            {expense.unit.floor
              ? ` · ${t('Expenses.floor')} ${expense.unit.floor}`
              : ''}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{t('Expenses.amount')}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(expense.amount)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{t('Expenses.totalPaid')}</Text>
              <Text style={[styles.summaryValue, styles.paid]}>
                {formatCurrency(completed)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{t('Expenses.remaining')}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  remaining > 0 ? styles.pending : styles.paid,
                ]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.payments}>
          <Text style={styles.sectionLabel}>{t('Expenses.payments')}</Text>
          {expense.payments.length === 0 ? (
            <Text style={styles.empty}>{t('Expenses.noPayments')}</Text>
          ) : (
            expense.payments.map(payment => {
              const status = PAYMENT_STATUS[payment.status];
              return (
                <View key={payment.id} style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMethod} numberOfLines={1}>
                      {payment.paymentMethod || '—'}
                      {payment.externalPaymentId
                        ? ` · ${payment.externalPaymentId}`
                        : ''}
                    </Text>
                    <Text style={[styles.paymentStatus, {color: status.color}]}>
                      {t(status.labelKey)}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  {canManagePeriods && payment.status === 'PENDING' ? (
                    <View style={styles.paymentActions}>
                      <Button
                        title={t('Expenses.approveShort')}
                        size="sm"
                        onPress={() => updateStatus(payment.id, 'COMPLETED')}
                        loading={updatePayment.isPending}
                      />
                      <Button
                        title={t('Expenses.rejectShort')}
                        size="sm"
                        variant="destructive"
                        onPress={() => updateStatus(payment.id, 'REJECTED')}
                        disabled={updatePayment.isPending}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {!canManagePeriods ? (
          <View style={styles.form}>
            <Input
              label={t('Expenses.paymentAmount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <Input
              label={t('Expenses.paymentMethod')}
              value={method}
              onChangeText={setMethod}
              placeholder={t('Expenses.paymentMethodPlaceholder')}
            />
            <Input
              label={t('Expenses.externalPaymentId')}
              value={externalId}
              onChangeText={setExternalId}
              placeholder={t('Expenses.externalPaymentIdPlaceholder')}
            />
            <Button
              title={t('Expenses.notifyPayment')}
              icon={
                <Ionicons name="card-outline" size={18} color={colors.white} />
              }
              onPress={submitPayment}
              loading={createPayment.isPending}
              disabled={!canSubmit || remaining <= 0}
              fullWidth
            />
          </View>
        ) : null}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xl, paddingTop: spacing.sm},
  summary: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  unit: {color: colors.text, fontSize: typography.h3, fontWeight: '700'},
  summaryGrid: {flexDirection: 'row', gap: spacing.md},
  summaryCell: {flex: 1, gap: 2},
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
  },
  paid: {color: colors.success},
  pending: {color: colors.warning},
  payments: {gap: spacing.sm},
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  empty: {color: colors.textSecondary, fontSize: typography.small},
  paymentRow: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  paymentInfo: {flex: 1, gap: 2, minWidth: 120},
  paymentMethod: {color: colors.text, fontSize: typography.small},
  paymentStatus: {fontSize: typography.caption, fontWeight: '600'},
  paymentAmount: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
  },
  paymentActions: {flexDirection: 'row', gap: spacing.sm, width: '100%'},
  form: {gap: spacing.lg},
});
