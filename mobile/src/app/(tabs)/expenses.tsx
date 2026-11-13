import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useRouter} from 'expo-router';
import {AppHeader, IconButton} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {Section} from '@/components/layout/Section';
import {PeriodCard} from '@/components/expenses/PeriodCard';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {
  useCollectionSummary,
  useCreateExpensePeriod,
  useDeleteExpensePeriod,
  useExpensePeriods,
} from '@/hooks/queries/useExpenses';
import {errorMessage} from '@/lib/apiError';
import {formatCurrency} from '@/lib/format';
import {toast} from '@/store/toastStore';
import type {ExpensePeriod} from '@/types/expense';
import {colors, spacing, typography} from '@/theme';

export default function ExpensesScreen() {
  const router = useRouter();
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
  const [periodToDelete, setPeriodToDelete] = useState<ExpensePeriod | null>(null);

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
      setPeriodError('Ingresá el nombre del período.');
      return;
    }
    createPeriod.mutate(
      {buildingId: activeBuildingId, period: value},
      {
        onSuccess: () => {
          toast.success('Período creado correctamente.');
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
          toast.success('Período eliminado correctamente.');
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
        <AppHeader title="Expensas" />
        <LoadingState message="Cargando expensas..." />
      </Screen>
    );
  }

  if (buildingsError) {
    return (
      <Screen>
        <AppHeader title="Expensas" />
        <ErrorState
          message="No pudimos cargar tus edificios."
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
        title="Expensas"
        subtitle="Períodos, pagos y estado de cobranza."
        right={
          canManage ? (
            <IconButton icon="add" label="Nuevo período" onPress={openCreate} />
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
          title="Elegí un edificio"
          description="Seleccioná un edificio para ver sus períodos de expensas."
        />
      ) : periodsQuery.isLoading ? (
        <LoadingState message="Cargando períodos..." />
      ) : periodsQuery.isError ? (
        <ErrorState
          message="No pudimos cargar los períodos."
          onRetry={() => periodsQuery.refetch()}
        />
      ) : (
        <View style={styles.content}>
          {canManage && summary ? (
            <Card style={styles.summary}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Deuda</Text>
                <Text style={[styles.summaryValue, {color: colors.danger}]}>
                  {formatCurrency(summary.debtTotal)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Cobrado</Text>
                <Text style={[styles.summaryValue, {color: colors.success}]}>
                  {formatCurrency(summary.totalPaid)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Cobranza</Text>
                <Text style={styles.summaryValue}>
                  {summary.collectionRate.toFixed(1)}%
                </Text>
              </View>
            </Card>
          ) : null}

          <Section
            title={`Períodos de ${activeBuilding?.name ?? ''}`}
            action={
              canManage ? (
                <Button
                  title="Nuevo"
                  size="sm"
                  icon={
                    <Text style={styles.plus}>+</Text>
                  }
                  onPress={openCreate}
                />
              ) : undefined
            }>
            {periods.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="Sin períodos"
                description={
                  canManage
                    ? 'Creá el primer período para cargar las expensas del edificio.'
                    : 'Todavía no hay períodos de expensas publicados.'
                }
                actionLabel={canManage ? 'Crear período' : undefined}
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
        title="Nuevo período">
        <View style={styles.form}>
          <Input
            label="Período"
            placeholder="Ej: Noviembre 2026 o 2026-11"
            value={period}
            onChangeText={value => {
              setPeriod(value);
              if (periodError) setPeriodError(null);
            }}
            error={periodError ?? undefined}
            autoCapitalize="sentences"
          />
          <Button
            title="Crear período"
            loading={createPeriod.isPending}
            disabled={!period.trim()}
            fullWidth
            onPress={submitPeriod}
          />
        </View>
      </ModalSheet>

      <ConfirmDialog
        visible={!!periodToDelete}
        title="Eliminar período"
        description={`¿Seguro que querés eliminar el período ${periodToDelete?.period ?? ''}? Se eliminarán sus expensas y pagos.`}
        confirmLabel="Eliminar"
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
