import {BuildingFormModal} from '@/components/buildings/BuildingFormModal';
import {AppHeader, IconButton} from '@/components/layout/AppHeader';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Section} from '@/components/layout/Section';
import {Badge} from '@/components/ui/Badge';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Screen} from '@/components/ui/Screen';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {
  useCreateBuilding,
  useDeleteBuilding,
  useUpdateBuilding,
} from '@/hooks/queries/useBuildings';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {errorMessage} from '@/lib/apiError';
import type {BuildingFormValues} from '@/schemas/building';
import {useAuthStore} from '@/store/authStore';
import {toast} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';
import type {Building} from '@/types/building';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';

export default function BuildingsScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const user = useAuthStore(state => state.user);
  const {buildings, isLoading, isRefetching, isError, refetch} =
    useActiveBuilding();
  const createBuilding = useCreateBuilding();
  const updateBuilding = useUpdateBuilding();
  const deleteBuilding = useDeleteBuilding();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(
    null,
  );

  const isSuperAdmin = user?.globalRole === 'SUPERADMIN';

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (building: Building) => {
    setEditing(building);
    setFormOpen(true);
  };

  const submit = (values: BuildingFormValues) => {
    if (editing) {
      updateBuilding.mutate(
        {id: editing.id, ...values},
        {
          onSuccess: () => {
            toast.success(t('Buildings.updateSuccess'));
            setFormOpen(false);
            setEditing(null);
          },
          onError: error => toast.error(errorMessage(error)),
        },
      );
      return;
    }
    createBuilding.mutate(values, {
      onSuccess: () => {
        toast.success(t('Buildings.createSuccess'));
        setFormOpen(false);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  const confirmDelete = () => {
    if (!buildingToDelete) return;
    deleteBuilding.mutate(buildingToDelete.id, {
      onSuccess: () => {
        toast.success(t('Buildings.deleteSuccess'));
        setBuildingToDelete(null);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  return (
    <RequireAccess path="/buildings">
      <Screen refreshing={isRefetching} onRefresh={() => refetch()}>
        <AppHeader
          title={t('Buildings.title')}
          subtitle={t('Buildings.subtitle')}
          right={
            isSuperAdmin ? (
              <IconButton
                icon="add"
                label={t('Buildings.newBuilding')}
                onPress={openCreate}
              />
            ) : undefined
          }
        />

        {isLoading ? (
          <LoadingState message={t('Buildings.loading')} />
        ) : isError ? (
          <ErrorState
            message={t('Buildings.loadError')}
            onRetry={() => refetch()}
          />
        ) : buildings.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title={t('Buildings.emptyTitle')}
            description={t('Buildings.emptyDescription')}
            actionLabel={
              isSuperAdmin ? t('Buildings.registerBuilding') : undefined
            }
            onAction={isSuperAdmin ? openCreate : undefined}
          />
        ) : (
          <Section title={t('Buildings.yourBuildings')}>
            <View style={styles.list}>
              {buildings.map(building => (
                <Card
                  key={building.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/buildings/[id]',
                      params: {id: building.id},
                    })
                  }
                  accessibilityLabel={building.name}>
                  <View style={styles.cardHeader}>
                    <View style={styles.icon}>
                      <Ionicons
                        name="business-outline"
                        size={21}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.headerText}>
                      <Text style={styles.name} numberOfLines={1}>
                        {building.name}
                      </Text>
                      <Text style={styles.address} numberOfLines={2}>
                        {building.address}
                        {building.city ? ` · ${building.city}` : ''}
                      </Text>
                    </View>
                    <Badge
                      label={
                        building.active
                          ? t('Common.active')
                          : t('Common.inactive')
                      }
                      intent={building.active ? 'success' : 'danger'}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    {building.canManage ? (
                      <View style={styles.meta}>
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={14}
                          color={colors.indigo}
                        />
                        <Text style={styles.metaText}>
                          {t('Buildings.manage')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.meta}>
                        <Ionicons
                          name="eye-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {t('Buildings.readOnly')}
                        </Text>
                      </View>
                    )}
                    <View style={styles.actions}>
                      {building.canManage ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'Buildings.editBuildingAccessibility',
                            {name: building.name},
                          )}
                          hitSlop={6}
                          onPress={() => openEdit(building)}
                          style={styles.action}>
                          <Ionicons
                            name="pencil-outline"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      ) : null}
                      {building.canDelete ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'Buildings.deleteBuildingAccessibility',
                            {name: building.name},
                          )}
                          hitSlop={6}
                          onPress={() => setBuildingToDelete(building)}
                          style={styles.action}>
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.danger}
                          />
                        </Pressable>
                      ) : null}
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={colors.textMuted}
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </Section>
        )}

        {formOpen ? (
          <BuildingFormModal
            visible
            editing={
              editing
                ? {
                    id: editing.id,
                    name: editing.name,
                    address: editing.address,
                    city: editing.city,
                    country: editing.country,
                  }
                : null
            }
            pending={createBuilding.isPending || updateBuilding.isPending}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSubmit={submit}
          />
        ) : null}

        <ConfirmDialog
          visible={!!buildingToDelete}
          title={t('Buildings.deleteTitle')}
          description={t('Buildings.deleteConfirmNamed', {
            name: buildingToDelete?.name ?? '',
          })}
          confirmLabel={t('Common.delete')}
          pending={deleteBuilding.isPending}
          onCancel={() => setBuildingToDelete(null)}
          onConfirm={confirmDelete}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  list: {gap: spacing.md},
  card: {gap: spacing.md, padding: spacing.md},
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerText: {flex: 1, gap: 3},
  name: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  address: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 18,
  },
  metaRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  meta: {alignItems: 'center', flexDirection: 'row', gap: 5},
  metaText: {color: colors.textMuted, fontSize: typography.caption},
  actions: {alignItems: 'center', flexDirection: 'row', gap: spacing.xs},
  action: {padding: spacing.xs},
});
