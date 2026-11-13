import {PeriodCard} from '@/components/expenses/PeriodCard';
import {AppHeader, IconButton} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {Section} from '@/components/layout/Section';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Screen} from '@/components/ui/Screen';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {
  useCollectionSummary,
  useCreateExpensePeriod,
  useDeleteExpensePeriod,
  useExpensePeriods,
} from '@/hooks/queries/useExpenses';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {errorMessage} from '@/lib/apiError';
import {formatCurrency} from '@/lib/format';
import {toast} from '@/store/toastStore';
import {colors, spacing, typography} from '@/theme';
import type {ExpensePeriod} from '@/types/expense';
import {useRouter} from 'expo-router';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

export default function ExpensesScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const {
    buildings,
    activeBuilding,
    activeBuildingId,
    setSelectedBuildingId,
    isLoading: loadingBuildings,
    isError: buildingsError,
    refetch: refetchBuildings,
    isRefetching,
  } = useActiveBuilding();
  const periodsQuery = useExpensePeriods(activeBuildingId);
  const summaryQuery = useCollectionSummary(
    activeBuilding?.canManage ? activeBuildingId : null,
  );
  const createPeriod = useCreateExpensePeriod();
  const deletePeriod = useDeleteExpensePeriod();

  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState('');
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<ExpensePeriod | null>(
    null,
  );

  const canManage = !!activeBuilding?.canManage;
  const periods = periodsQuery.data ?? [];
  const summary = summaryQuery.data;

  const openCreate = () => {
    setPeriod('');
    setPeriodError(null);
    setCreateOpen(true);
  };

  const submitPeriod = () => {
    if (!activeBuildingId) return;
    const value = period.trim();
    if (!value) {
      setPeriodError(t('Expenses.periodRequired'));
      return;
    }
    createPeriod.mutate(
      {buildingId: activeBuildingId, period: value},
      {
        onSuccess: () => {
          toast.success(t('Expenses.createPeriodSuccess'));
          setCreateOpen(false);
        },
        onError: error => {
          setPeriodError(errorMessage(error));
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!periodToDelete) return;
    deletePeriod.mutate(
      {
        periodId: periodToDelete.id,
        buildingId: periodToDelete.buildingId,
      },
      {
        onSuccess: () => {
          toast.success(t('Expenses.deletePeriodSuccess'));
          setPeriodToDelete(null);
        },
        onError: error => {
          toast.error(errorMessage(error));
        },
      },
    );
  };

  if (loadingBuildings) {
    return (
      <Screen>
        <AppHeader title={t('Expenses.title')} />
        <LoadingState message={t('Expenses.loading')} />
      </Screen>
    );
  }

  if (buildingsError) {
    return (
      <Screen>
        <AppHeader title={t('Expenses.title')} />
        <ErrorState
          message={t('Expenses.buildingsError')}
          onRetry={() => refetchBuildings()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={isRefetching || periodsQuery.isRefetching}
      onRefresh={() => {
        refetchBuildings();
        periodsQuery.refetch();
        summaryQuery.refetch();
      }}>
      <AppHeader
        title={t('Expenses.title')}
        subtitle={t('Expenses.subtitle')}
        right={
          canManage ? (
            <IconButton
              icon="add"
              label={t('Expenses.newPeriodTitle')}
              onPress={openCreate}
            />
          ) : undefined
        }
      />

      <BuildingSwitcher
        buildings={buildings}
        value={activeBuildingId}
        onChange={setSelectedBuildingId}
      />

      {!activeBuildingId ? (
        <EmptyState
          icon="receipt-outline"
          title={t('Expenses.selectBuilding')}
          description={t('Expenses.chooseBuildingDesc')}
        />
      ) : periodsQuery.isLoading ? (
        <LoadingState message={t('Expenses.loadingPeriods')} />
      ) : periodsQuery.isError ? (
        <ErrorState
          message={t('Expenses.loadErrorPeriods')}
          onRetry={() => periodsQuery.refetch()}
        />
      ) : (
        <View style={styles.content}>
          {canManage && summary ? (
            <Card style={styles.summary}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('Expenses.debt')}</Text>
                <Text style={[styles.summaryValue, {color: colors.danger}]}>
                  {formatCurrency(summary.debtTotal)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>
                  {t('Expenses.collected')}
                </Text>
                <Text style={[styles.summaryValue, {color: colors.success}]}>
                  {formatCurrency(summary.totalPaid)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>
                  {t('Expenses.collection')}
                </Text>
                <Text style={styles.summaryValue}>
                  {summary.collectionRate.toFixed(1)}%
                </Text>
              </View>
            </Card>
          ) : null}

          <Section
            title={t('Expenses.periodsOf', {
              building: activeBuilding?.name ?? '',
            })}
            action={
              canManage ? (
                <Button
                  title={t('Expenses.newShort')}
                  size="sm"
                  icon={<Text style={styles.plus}>+</Text>}
                  onPress={openCreate}
                />
              ) : undefined
            }>
            {periods.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title={t('Expenses.noPeriodsTitle')}
                description={
                  canManage
                    ? t('Expenses.noPeriodsCanManage')
                    : t('Expenses.noPeriodsCannotManage')
                }
                actionLabel={
                  canManage ? t('Expenses.createPeriodAction') : undefined
                }
                onAction={canManage ? openCreate : undefined}
              />
            ) : (
              <View style={styles.list}>
                {periods.map(item => (
                  <PeriodCard
                    key={item.id}
                    period={item}
                    canManage={canManage}
                    onPress={() =>
                      router.push({
                        pathname: '/expenses/[periodId]',
                        params: {periodId: item.id},
                      })
                    }
                    onDelete={() => setPeriodToDelete(item)}
                  />
                ))}
              </View>
            )}
          </Section>
        </View>
      )}

      <ModalSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('Expenses.newPeriodTitle')}>
        <View style={styles.form}>
          <Input
            label={t('Expenses.periodLabel')}
            placeholder={t('Expenses.periodPlaceholderMobile')}
            value={period}
            onChangeText={value => {
              setPeriod(value);
              if (periodError) setPeriodError(null);
            }}
            error={periodError ?? undefined}
            autoCapitalize="sentences"
          />
          <Button
            title={t('Expenses.createPeriodAction')}
            loading={createPeriod.isPending}
            disabled={!period.trim()}
            fullWidth
            onPress={submitPeriod}
          />
        </View>
      </ModalSheet>

      <ConfirmDialog
        visible={!!periodToDelete}
        title={t('Expenses.deletePeriodTitle')}
        description={t('Expenses.deletePeriodConfirmNamed', {
          period: periodToDelete?.period ?? '',
        })}
        confirmLabel={t('Common.delete')}
        pending={deletePeriod.isPending}
        onCancel={() => setPeriodToDelete(null)}
        onConfirm={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xl},
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.md,
  },
  summaryCell: {alignItems: 'center', flex: 1, gap: 2},
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  summaryDivider: {backgroundColor: colors.border, height: 28, width: 1},
  list: {gap: spacing.sm},
  plus: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  form: {gap: spacing.lg, paddingTop: spacing.sm},
});
