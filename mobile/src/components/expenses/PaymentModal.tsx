import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {
  useCreatePayment,
  useUpdatePaymentStatus,
} from '@/hooks/queries/useExpenses';
import {toast} from '@/store/toastStore';
import {formatCurrency} from '@/lib/format';
import type {Expense, PaymentStatus} from '@/types/expense';
import {colors, radius, spacing, typography} from '@/theme';

const PAYMENT_STATUS: Record<PaymentStatus, {label: string; color: string}> = {
  COMPLETED: {label: 'Aprobado', color: colors.success},
  PENDING: {label: 'Pendiente de aprobación', color: colors.warning},
  REJECTED: {label: 'Rechazado', color: colors.danger},
  FAILED: {label: 'Fallido', color: colors.danger},
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
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [externalId, setExternalId] = useState('');
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePaymentStatus();

  if (!expense) return null;

  const completed = expense.payments
    .filter(payment => payment.status === 'COMPLETED')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = expense.remaining ?? Math.max(expense.amount - completed, 0);
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
          toast.success('Pago registrado correctamente.');
          onClose();
        },
        onError: () => toast.error('No se pudo registrar el pago.'),
      },
    );
  };

  const updateStatus = (paymentId: string, status: 'COMPLETED' | 'REJECTED') => {
    updatePayment.mutate(
      {paymentId, periodId, status},
      {
        onSuccess: () =>
          toast.success(
            status === 'COMPLETED'
              ? 'Pago aprobado correctamente.'
              : 'Pago rechazado.',
          ),
        onError: () => toast.error('No se pudo actualizar el pago.'),
      },
    );
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={canManagePeriods ? 'Registrar pago' : 'Notificar que pagué'}>
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.unit}>
            {expense.unit.name}
            {expense.unit.floor ? ` · Piso ${expense.unit.floor}` : ''}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Monto</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(expense.amount)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Pagado</Text>
              <Text style={[styles.summaryValue, styles.paid]}>
                {formatCurrency(completed)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Saldo</Text>
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
          <Text style={styles.sectionLabel}>Pagos</Text>
          {expense.payments.length === 0 ? (
            <Text style={styles.empty}>Sin pagos registrados.</Text>
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
                      {status.label}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  {canManagePeriods && payment.status === 'PENDING' ? (
                    <View style={styles.paymentActions}>
                      <Button
                        title="Aprobar"
                        size="sm"
                        onPress={() => updateStatus(payment.id, 'COMPLETED')}
                        loading={updatePayment.isPending}
                      />
                      <Button
                        title="Rechazar"
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
              label="Monto del pago"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <Input
              label="Método de pago (opcional)"
              value={method}
              onChangeText={setMethod}
              placeholder="Efectivo, transferencia..."
            />
            <Input
              label="ID externo (opcional)"
              value={externalId}
              onChangeText={setExternalId}
              placeholder="Referencia de pago"
            />
            <Button
              title="Notificar pago"
              icon={<Ionicons name="card-outline" size={18} color={colors.white} />}
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
  paymentAmount: {color: colors.text, fontSize: typography.small, fontWeight: '700'},
  paymentActions: {flexDirection: 'row', gap: spacing.sm, width: '100%'},
  form: {gap: spacing.lg},
});
