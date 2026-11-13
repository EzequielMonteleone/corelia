import {PaymentModal} from '@/components/expenses/PaymentModal';
import {AppHeader} from '@/components/layout/AppHeader';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Section} from '@/components/layout/Section';
import {Badge, type BadgeIntent} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Input} from '@/components/ui/Input';
import {Screen} from '@/components/ui/Screen';
import {Select} from '@/components/ui/Select';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {useBuilding, useBuildingUnits} from '@/hooks/queries/useBuildings';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpensePeriod,
  useExpensePeriodAuditLogs,
  useUpdateExpense,
  useUpdateExpensePeriodStatus,
} from '@/hooks/queries/useExpenses';
import {errorMessage} from '@/lib/apiError';
import {downloadExpensePeriodExport, type ExportFormat} from '@/lib/exportFile';
import {formatCurrency, formatDate, formatDateTime} from '@/lib/format';
import {toast} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';
import type {Expense, ExpenseStatus} from '@/types/expense';
import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

const EXPENSE_STATUS: Record<
  ExpenseStatus,
  {
    labelKey:
      | 'Expenses.statusUnpaidExpense'
      | 'Expenses.statusPendingPayment'
      | 'Expenses.statusPaidExpense';
    intent: BadgeIntent;
  }
> = {
  UNPAID: {labelKey: 'Expenses.statusUnpaidExpense', intent: 'danger'},
  PENDING: {labelKey: 'Expenses.statusPendingPayment', intent: 'warning'},
  PAID: {labelKey: 'Expenses.statusPaidExpense', intent: 'success'},
};

function completedPayments(expense: Expense) {
  return expense.payments
    .filter(payment => payment.status === 'COMPLETED')
    .reduce((sum, payment) => sum + payment.amount, 0);
}

function remainingAmount(expense: Expense) {
  return (
    expense.remaining ??
    Math.max(expense.amount - completedPayments(expense), 0)
  );
}

export default function ExpensePeriodScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const {periodId} = useLocalSearchParams<{periodId: string}>();
  const id = periodId ?? null;

  const periodQuery = useExpensePeriod(id);
  const period = periodQuery.data;
  const buildingQuery = useBuilding(period?.buildingId ?? null);
  const unitsQuery = useBuildingUnits(period?.buildingId ?? null);
  const auditQuery = useExpensePeriodAuditLogs(
    buildingQuery.data?.canManage ? id : null,
  );
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateStatus = useUpdateExpensePeriodStatus();

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const canManage = !!buildingQuery.data?.canManage;
  const isOpen = period?.status === 'OPEN';
  const expenses = period?.expenses ?? [];
  const units = unitsQuery.data ?? [];
  const totalInvoiced = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = expenses.reduce(
    (sum, item) => sum + completedPayments(item),
    0,
  );
  const totalDebt = Math.max(totalInvoiced - totalPaid, 0);
  const collectionRate =
    totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
  const assignedUnitIds = new Set(expenses.map(item => item.unitId));
  const availableUnits = units.filter(unit => !assignedUnitIds.has(unit.id));

  const addExpense = () => {
    if (!id) return;
    if (!selectedUnitId) {
      toast.error(t('Expenses.selectUnitError'));
      return;
    }
    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('Expenses.invalidAmount'));
      return;
    }
    createExpense.mutate(
      {periodId: id, unitId: selectedUnitId, amount},
      {
        onSuccess: () => {
          toast.success(t('Expenses.addExpenseSuccess'));
          setSelectedUnitId('');
          setNewAmount('');
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const startEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditAmount(String(expense.amount));
  };

  const saveEdit = (expense: Expense) => {
    if (!id) return;
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('Expenses.invalidAmount'));
      return;
    }
    updateExpense.mutate(
      {expenseId: expense.id, periodId: id, amount},
      {
        onSuccess: () => {
          toast.success(t('Expenses.editExpenseSuccess'));
          setEditingExpenseId(null);
          setEditAmount('');
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const confirmDeleteExpense = () => {
    if (!id || !expenseToDelete) return;
    deleteExpense.mutate(
      {expenseId: expenseToDelete.id, periodId: id},
      {
        onSuccess: () => {
          toast.success(t('Expenses.deleteExpenseSuccess'));
          setExpenseToDelete(null);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const toggleStatus = () => {
    if (!id || !period) return;
    const next = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    updateStatus.mutate(
      {periodId: id, status: next},
      {
        onSuccess: () =>
          toast.success(
            t(
              next === 'OPEN'
                ? 'Expenses.periodReopened'
                : 'Expenses.periodClosed',
            ),
          ),
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const runExport = async (format: ExportFormat) => {
    if (!id) return;
    setExporting(format);
    try {
      await downloadExpensePeriodExport(id, format);
      toast.success(t('Expenses.exportSuccess'));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(null);
    }
  };

  if (periodQuery.isLoading) {
    return (
      <RequireAccess path="/expenses">
        <Screen>
          <AppHeader
            title={t('Expenses.title')}
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message={t('Expenses.loadingPeriod')} />
        </Screen>
      </RequireAccess>
    );
  }

  if (periodQuery.isError || !period) {
    return (
      <RequireAccess path="/expenses">
        <Screen>
          <AppHeader
            title={t('Expenses.title')}
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message={t('Expenses.loadErrorPeriod')}
            onRetry={() => periodQuery.refetch()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  return (
    <RequireAccess path="/expenses">
      <Screen
        refreshing={periodQuery.isRefetching}
        onRefresh={() => {
          periodQuery.refetch();
          auditQuery.refetch();
        }}>
        <AppHeader
          title={period.period}
          subtitle={period.building.name}
          showBell={false}
          onBack={() => router.back()}
        />

        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.headerPeriod}>{period.period}</Text>
              <Text style={styles.headerMeta}>
                {t('Expenses.generatedOn', {
                  date: formatDate(period.generatedAt),
                })}
              </Text>
            </View>
            <Badge
              label={
                isOpen ? t('Expenses.statusOpen') : t('Expenses.statusClosed')
              }
              intent={isOpen ? 'success' : 'default'}
            />
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('Expenses.total')}</Text>
              <Text style={styles.statValue}>
                {formatCurrency(totalInvoiced)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('Expenses.paid')}</Text>
              <Text style={[styles.statValue, {color: colors.success}]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('Expenses.balance')}</Text>
              <Text
                style={[
                  styles.statValue,
                  {color: totalDebt > 0 ? colors.warning : colors.success},
                ]}>
                {formatCurrency(totalDebt)}
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.min(collectionRate, 100)}%`},
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {t('Expenses.collectionProgress', {
              rate: collectionRate.toFixed(1),
            })}
          </Text>
          {canManage ? (
            <Button
              title={
                isOpen ? t('Expenses.closePeriod') : t('Expenses.reopenPeriod')
              }
              variant={isOpen ? 'secondary' : 'primary'}
              size="sm"
              loading={updateStatus.isPending}
              onPress={toggleStatus}
            />
          ) : null}
        </Card>

        <View style={styles.exportRow}>
          <Button
            title={t('Expenses.exportCsv')}
            icon={
              <Ionicons name="download-outline" size={17} color={colors.text} />
            }
            variant="outline"
            size="sm"
            loading={exporting === 'csv'}
            disabled={exporting !== null}
            onPress={() => runExport('csv')}
            style={styles.exportButton}
          />
          <Button
            title={t('Expenses.exportPdf')}
            icon={
              <Ionicons name="download-outline" size={17} color={colors.text} />
            }
            variant="outline"
            size="sm"
            loading={exporting === 'pdf'}
            disabled={exporting !== null}
            onPress={() => runExport('pdf')}
            style={styles.exportButton}
          />
        </View>

        <View style={styles.sections}>
          {canManage && isOpen ? (
            <Section title={t('Expenses.addExpenseTitle')}>
              <Card style={styles.addCard}>
                {availableUnits.length === 0 ? (
                  <Text style={styles.muted}>
                    {t('Expenses.allUnitsHaveExpense')}
                  </Text>
                ) : (
                  <>
                    <Select
                      label={t('Expenses.unit')}
                      value={selectedUnitId}
                      onChange={setSelectedUnitId}
                      placeholder={t('Expenses.selectUnit')}
                      options={availableUnits.map(unit => ({
                        label: unit.floor
                          ? t('Expenses.unitWithFloor', {
                              unit: unit.name,
                              floor: unit.floor,
                            })
                          : unit.name,
                        value: unit.id,
                      }))}
                    />
                    <Input
                      label={t('Expenses.amount')}
                      value={newAmount}
                      onChangeText={setNewAmount}
                      keyboardType="decimal-pad"
                      placeholder={t('Expenses.amountPlaceholder')}
                    />
                    <Button
                      title={t('Expenses.addExpenseTitle')}
                      loading={createExpense.isPending}
                      disabled={!selectedUnitId || !newAmount.trim()}
                      fullWidth
                      onPress={addExpense}
                    />
                  </>
                )}
              </Card>
            </Section>
          ) : null}

          <Section
            title={t('Expenses.expensesCount', {count: expenses.length})}>
            {expenses.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title={t('Expenses.noExpensesTitle')}
                description={t('Expenses.noExpensesDescription')}
              />
            ) : (
              <View style={styles.list}>
                {expenses.map(expense => {
                  const status = EXPENSE_STATUS[expense.status];
                  const paid = completedPayments(expense);
                  const remaining = remainingAmount(expense);
                  const editing = editingExpenseId === expense.id;

                  return (
                    <Card key={expense.id} style={styles.expenseCard}>
                      <View style={styles.expenseHeader}>
                        <View style={styles.expenseUnit}>
                          <View style={styles.expenseIcon}>
                            <Ionicons
                              name="home-outline"
                              size={16}
                              color={colors.indigo}
                            />
                          </View>
                          <View>
                            <Text style={styles.expenseName}>
                              {expense.unit.name}
                            </Text>
                            <Text style={styles.expenseFloor}>
                              {expense.unit.floor
                                ? t('Expenses.floorValue', {
                                    floor: expense.unit.floor,
                                  })
                                : t('Expenses.noFloor')}
                            </Text>
                          </View>
                        </View>
                        <Badge
                          label={t(status.labelKey)}
                          intent={status.intent}
                        />
                      </View>

                      {editing ? (
                        <View style={styles.editRow}>
                          <Input
                            value={editAmount}
                            onChangeText={setEditAmount}
                            keyboardType="decimal-pad"
                            containerStyle={styles.editInput}
                          />
                          <Button
                            title={t('Common.save')}
                            size="sm"
                            loading={updateExpense.isPending}
                            onPress={() => saveEdit(expense)}
                          />
                          <Button
                            title={t('Common.cancel')}
                            size="sm"
                            variant="ghost"
                            onPress={() => setEditingExpenseId(null)}
                          />
                        </View>
                      ) : (
                        <>
                          <View style={styles.amounts}>
                            <Amount
                              label={t('Expenses.amount')}
                              value={formatCurrency(expense.amount)}
                            />
                            <Amount
                              label={t('Expenses.paid')}
                              value={formatCurrency(paid)}
                              tint={colors.success}
                            />
                            <Amount
                              label={t('Expenses.balance')}
                              value={formatCurrency(remaining)}
                              tint={
                                remaining > 0 ? colors.warning : colors.success
                              }
                            />
                          </View>
                          <View style={styles.expenseActions}>
                            <Button
                              title={
                                canManage
                                  ? t('Expenses.paymentStatusTitle')
                                  : t('Expenses.notifyPayment')
                              }
                              size="sm"
                              variant="secondary"
                              onPress={() => setPaymentExpense(expense)}
                            />
                            {canManage && isOpen ? (
                              <>
                                <Button
                                  title={t('Expenses.edit')}
                                  size="sm"
                                  variant="outline"
                                  onPress={() => startEdit(expense)}
                                />
                                <Button
                                  title={t('Common.delete')}
                                  size="sm"
                                  variant="destructive"
                                  onPress={() => setExpenseToDelete(expense)}
                                />
                              </>
                            ) : null}
                          </View>
                        </>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </Section>

          {canManage ? (
            <Section title={t('Expenses.activityTitle')}>
              {auditQuery.isLoading ? (
                <LoadingState message={t('Expenses.loadingActivity')} />
              ) : (auditQuery.data ?? []).length === 0 ? (
                <Text style={styles.muted}>{t('Expenses.activityEmpty')}</Text>
              ) : (
                <View style={styles.list}>
                  {(auditQuery.data ?? []).slice(0, 12).map(log => (
                    <View key={log.id} style={styles.auditRow}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                      <View style={styles.auditText}>
                        <Text style={styles.auditAction}>{log.action}</Text>
                        <Text style={styles.auditMeta}>
                          {formatDateTime(log.createdAt)} · {log.entityType}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Section>
          ) : null}
        </View>

        {paymentExpense ? (
          <PaymentModal
            expense={paymentExpense}
            periodId={period.id}
            visible
            canManagePeriods={canManage}
            onClose={() => setPaymentExpense(null)}
          />
        ) : null}

        <ConfirmDialog
          visible={!!expenseToDelete}
          title={t('Expenses.deleteExpenseTitle')}
          description={t('Expenses.deleteExpenseConfirmNamed', {
            unit: expenseToDelete?.unit.name ?? '',
          })}
          confirmLabel={t('Common.delete')}
          pending={deleteExpense.isPending}
          onCancel={() => setExpenseToDelete(null)}
          onConfirm={confirmDeleteExpense}
        />
      </Screen>
    </RequireAccess>
  );
}

function Amount({
  label,
  value,
  tint = colors.text,
}: {
  label: string;
  value: string;
  tint?: string;
}) {
  return (
    <View style={styles.amountCell}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, {color: tint}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {gap: spacing.md, marginBottom: spacing.md, padding: spacing.lg},
  headerTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerText: {flex: 1, gap: 2},
  headerPeriod: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerMeta: {color: colors.textMuted, fontSize: typography.small},
  stats: {flexDirection: 'row'},
  stat: {alignItems: 'center', flex: 1, gap: 2},
  statDivider: {backgroundColor: colors.border, height: 30, width: 1},
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  statValue: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.full,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 6,
  },
  progressLabel: {color: colors.textMuted, fontSize: typography.caption},
  exportRow: {flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl},
  exportButton: {flex: 1},
  sections: {gap: spacing.xxl},
  addCard: {gap: spacing.md},
  muted: {color: colors.textMuted, fontSize: typography.small, lineHeight: 18},
  list: {gap: spacing.sm},
  expenseCard: {gap: spacing.md, padding: spacing.md},
  expenseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  expenseUnit: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  expenseIcon: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: radius.sm,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  expenseName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  expenseFloor: {color: colors.textMuted, fontSize: typography.caption},
  amounts: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  amountCell: {alignItems: 'center', flex: 1, gap: 2},
  amountLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  amountValue: {fontSize: typography.small, fontWeight: '700'},
  expenseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  editRow: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  editInput: {flex: 1},
  auditRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  auditText: {flex: 1, gap: 2},
  auditAction: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
  },
  auditMeta: {color: colors.textMuted, fontSize: typography.caption},
});
