import {
  AmenityCreateModal,
  AmenitySettingsModal,
} from '@/components/buildings/AmenityModals';
import {
  UnitFormModal,
  type UnitFormValues,
} from '@/components/buildings/UnitFormModal';
import {AppHeader} from '@/components/layout/AppHeader';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Section} from '@/components/layout/Section';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Screen} from '@/components/ui/Screen';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {
  useBuilding,
  useBuildingAmenities,
  useBuildingUnits,
  useCreateBuildingAmenity,
  useCreateUnit,
  useDeleteBuildingAmenity,
  useDeleteUnit,
  useUpdateBuildingAmenity,
  useUpdateUnit,
} from '@/hooks/queries/useBuildings';
import {errorMessage} from '@/lib/apiError';
import {toast} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';
import type {BuildingAmenity} from '@/types/amenity';
import type {Unit} from '@/types/unit';
import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';

export default function BuildingDetailScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const {id} = useLocalSearchParams<{id: string}>();
  const buildingId = id ?? null;

  const buildingQuery = useBuilding(buildingId);
  const unitsQuery = useBuildingUnits(buildingId);
  const amenitiesQuery = useBuildingAmenities(buildingId);
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createAmenity = useCreateBuildingAmenity();
  const updateAmenity = useUpdateBuildingAmenity();
  const deleteAmenity = useDeleteBuildingAmenity();

  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [amenityCreateOpen, setAmenityCreateOpen] = useState(false);
  const [settingsItem, setSettingsItem] = useState<BuildingAmenity | null>(
    null,
  );
  const [amenityToDelete, setAmenityToDelete] =
    useState<BuildingAmenity | null>(null);

  const building = buildingQuery.data;
  const units = unitsQuery.data ?? [];
  const amenities = useMemo(
    () => amenitiesQuery.data?.amenities ?? [],
    [amenitiesQuery.data],
  );
  const catalog = amenitiesQuery.data?.catalog ?? [];
  const canManage = !!building?.canManage;

  const existingAmenityIds = useMemo(
    () => new Set(amenities.map(item => item.amenityId)),
    [amenities],
  );

  const openCreateUnit = () => {
    setEditingUnit(null);
    setUnitFormOpen(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormOpen(true);
  };

  const saveUnit = (values: UnitFormValues) => {
    if (!buildingId) return;
    if (editingUnit) {
      updateUnit.mutate(
        {
          id: editingUnit.id,
          name: values.name,
          floor: values.floor ?? null,
          coefficient: values.coefficient ?? null,
        },
        {
          onSuccess: () => {
            toast.success(t('Buildings.unitUpdateSuccess'));
            setUnitFormOpen(false);
            setEditingUnit(null);
          },
          onError: error => toast.error(errorMessage(error)),
        },
      );
      return;
    }
    createUnit.mutate(
      {buildingId, ...values},
      {
        onSuccess: () => {
          toast.success(t('Buildings.unitCreateSuccess'));
          setUnitFormOpen(false);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const confirmDeleteUnit = () => {
    if (!unitToDelete || !buildingId) return;
    deleteUnit.mutate(
      {id: unitToDelete.id, buildingId},
      {
        onSuccess: () => {
          toast.success(t('Buildings.unitDeleteSuccess'));
          setUnitToDelete(null);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const createNewAmenity = (input: {
    amenityId?: string;
    customAmenityName?: string;
  }) => {
    if (!buildingId) return;
    createAmenity.mutate(
      {buildingId, ...input},
      {
        onSuccess: () => {
          toast.success(t('Buildings.amenityCreateSuccess'));
          setAmenityCreateOpen(false);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const saveAmenitySettings = (input: {
    isEnabled?: boolean;
    customName?: string;
    slotMinutes?: number;
    maxConcurrent?: number;
    openTime?: string;
    closeTime?: string;
    rules?: string | null;
  }) => {
    if (!buildingId || !settingsItem) return;
    updateAmenity.mutate(
      {id: settingsItem.id, buildingId, ...input},
      {
        onSuccess: () => {
          toast.success(t('Buildings.amenitySettingsSaved'));
          setSettingsItem(null);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const toggleAmenity = (item: BuildingAmenity) => {
    if (!buildingId) return;
    updateAmenity.mutate(
      {id: item.id, buildingId, isEnabled: !item.isEnabled},
      {
        onSuccess: () => {
          toast.success(
            t(
              item.isEnabled
                ? 'Buildings.amenityDisabled'
                : 'Buildings.amenityEnabled',
            ),
          );
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const confirmDeleteAmenity = () => {
    if (!amenityToDelete || !buildingId) return;
    deleteAmenity.mutate(
      {id: amenityToDelete.id, buildingId},
      {
        onSuccess: () => {
          toast.success(t('Buildings.amenityDeleteSuccess'));
          setAmenityToDelete(null);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const refreshAll = () => {
    buildingQuery.refetch();
    unitsQuery.refetch();
    amenitiesQuery.refetch();
  };

  if (buildingQuery.isLoading) {
    return (
      <RequireAccess path="/buildings">
        <Screen>
          <AppHeader
            title={t('Buildings.detailTitle')}
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message={t('Buildings.loadingDetail')} />
        </Screen>
      </RequireAccess>
    );
  }

  if (buildingQuery.isError || !building) {
    return (
      <RequireAccess path="/buildings">
        <Screen>
          <AppHeader
            title={t('Buildings.detailTitle')}
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message={t('Buildings.loadDetailError')}
            onRetry={() => buildingQuery.refetch()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  return (
    <RequireAccess path="/buildings">
      <Screen
        refreshing={buildingQuery.isRefetching || unitsQuery.isRefetching}
        onRefresh={refreshAll}>
        <AppHeader
          title={building.name}
          subtitle={building.address}
          showBell={false}
          onBack={() => router.back()}
        />

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              {building.city}, {building.country}
            </Text>
          </View>
          {building.taxId ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                {t('Buildings.taxIdLine', {taxId: building.taxId})}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoFooter}>
            <Badge
              label={
                building.active ? t('Common.active') : t('Common.inactive')
              }
              intent={building.active ? 'success' : 'danger'}
            />
            <Badge
              label={canManage ? t('Users.admin') : t('Buildings.readOnly')}
              intent={canManage ? 'primary' : 'default'}
            />
            <Badge label={t('Buildings.unitsCount', {count: units.length})} />
          </View>
        </Card>

        <View style={styles.sections}>
          <Section
            title={t('Buildings.unitsTitle')}
            action={
              canManage ? (
                <Button
                  title={t('Common.add')}
                  size="sm"
                  onPress={openCreateUnit}
                />
              ) : undefined
            }>
            {unitsQuery.isLoading ? (
              <LoadingState message={t('Buildings.loadingUnits')} />
            ) : units.length === 0 ? (
              <EmptyState
                icon="home-outline"
                title={t('Buildings.noUnits')}
                description={t('Buildings.unitsEmptyMobile')}
              />
            ) : (
              <View style={styles.list}>
                {units.map(unit => (
                  <View key={unit.id} style={styles.unitRow}>
                    <View style={styles.unitIcon}>
                      <Ionicons
                        name="home-outline"
                        size={17}
                        color={colors.indigo}
                      />
                    </View>
                    <View style={styles.unitText}>
                      <Text style={styles.unitName}>{unit.name}</Text>
                      <Text style={styles.unitMeta}>
                        {t('Buildings.unitMeta', {
                          floor: unit.floor || '-',
                          coefficient: unit.coefficient ?? '-',
                        })}
                      </Text>
                    </View>
                    {canManage ? (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'Buildings.editUnitAccessibility',
                            {name: unit.name},
                          )}
                          hitSlop={6}
                          onPress={() => openEditUnit(unit)}
                          style={styles.action}>
                          <Ionicons
                            name="pencil-outline"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'Buildings.deleteUnitAccessibility',
                            {name: unit.name},
                          )}
                          hitSlop={6}
                          onPress={() => setUnitToDelete(unit)}
                          style={styles.action}>
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.danger}
                          />
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section
            title={t('Buildings.amenitiesTitle')}
            action={
              <View style={styles.sectionActions}>
                <Button
                  title={t('Buildings.reserve')}
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/amenities')}
                />
                {canManage ? (
                  <Button
                    title={t('Common.add')}
                    size="sm"
                    onPress={() => setAmenityCreateOpen(true)}
                  />
                ) : null}
              </View>
            }>
            {amenitiesQuery.isLoading ? (
              <LoadingState message={t('Buildings.loadingAmenities')} />
            ) : amenities.length === 0 ? (
              <EmptyState
                icon="sparkles-outline"
                title={t('Buildings.noAmenities')}
                description={t('Buildings.amenitiesEmptyMobile')}
              />
            ) : (
              <View style={styles.list}>
                {amenities.map(item => (
                  <View key={item.id} style={styles.amenityRow}>
                    <View style={styles.amenityHeader}>
                      <View style={styles.amenityIcon}>
                        <Ionicons
                          name="sparkles-outline"
                          size={17}
                          color={colors.purple}
                        />
                      </View>
                      <View style={styles.amenityText}>
                        <Text style={styles.amenityName} numberOfLines={1}>
                          {item.amenity.name}
                        </Text>
                        <Text style={styles.amenityMeta}>
                          {t(
                            item.amenity.isSystem
                              ? 'Buildings.amenityTypeCatalog'
                              : 'Buildings.amenityTypeCustom',
                          )}{' '}
                          · {item.slotMinutes} min · {item.openTime}–
                          {item.closeTime}
                        </Text>
                      </View>
                      {canManage ? (
                        <Switch
                          accessibilityLabel={t(
                            'Buildings.toggleAmenityAccessibility',
                            {name: item.amenity.name},
                          )}
                          value={item.isEnabled}
                          onValueChange={() => toggleAmenity(item)}
                          trackColor={{
                            false: colors.borderStrong,
                            true: colors.primaryDark,
                          }}
                          thumbColor={colors.white}
                        />
                      ) : (
                        <Badge
                          label={
                            item.isEnabled
                              ? t('Common.active')
                              : t('Common.inactive')
                          }
                          intent={item.isEnabled ? 'success' : 'danger'}
                        />
                      )}
                    </View>
                    {item.rules ? (
                      <Text style={styles.rules}>{item.rules}</Text>
                    ) : null}
                    {canManage ? (
                      <View style={styles.amenityActions}>
                        <Button
                          title={t('Buildings.settings')}
                          size="sm"
                          variant="outline"
                          onPress={() => setSettingsItem(item)}
                        />
                        <Button
                          title={t('Common.delete')}
                          size="sm"
                          variant="destructive"
                          onPress={() => setAmenityToDelete(item)}
                        />
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </Section>
        </View>

        {unitFormOpen ? (
          <UnitFormModal
            visible
            unit={editingUnit}
            pending={createUnit.isPending || updateUnit.isPending}
            onClose={() => {
              setUnitFormOpen(false);
              setEditingUnit(null);
            }}
            onSubmit={saveUnit}
          />
        ) : null}

        {amenityCreateOpen ? (
          <AmenityCreateModal
            visible
            catalog={catalog}
            existingIds={existingAmenityIds}
            pending={createAmenity.isPending}
            onClose={() => setAmenityCreateOpen(false)}
            onSubmit={createNewAmenity}
          />
        ) : null}

        {settingsItem ? (
          <AmenitySettingsModal
            visible
            item={settingsItem}
            pending={updateAmenity.isPending}
            onClose={() => setSettingsItem(null)}
            onSubmit={saveAmenitySettings}
          />
        ) : null}

        <ConfirmDialog
          visible={!!unitToDelete}
          title={t('Buildings.deleteUnitTitle')}
          description={t('Buildings.deleteUnitConfirm', {
            name: unitToDelete?.name ?? '',
          })}
          confirmLabel={t('Common.delete')}
          pending={deleteUnit.isPending}
          onCancel={() => setUnitToDelete(null)}
          onConfirm={confirmDeleteUnit}
        />

        <ConfirmDialog
          visible={!!amenityToDelete}
          title={t('Buildings.deleteAmenityTitle')}
          description={t('Buildings.deleteAmenityConfirmNamed', {
            name: amenityToDelete?.amenity.name ?? '',
          })}
          confirmLabel={t('Common.delete')}
          pending={deleteAmenity.isPending}
          onCancel={() => setAmenityToDelete(null)}
          onConfirm={confirmDeleteAmenity}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  infoCard: {gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.md},
  infoRow: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  infoText: {color: colors.textSecondary, fontSize: typography.small},
  infoFooter: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  sections: {gap: spacing.xxl},
  sectionActions: {flexDirection: 'row', gap: spacing.sm},
  list: {gap: spacing.sm},
  unitRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  unitIcon: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  unitText: {flex: 1, gap: 2},
  unitName: {color: colors.text, fontSize: typography.body, fontWeight: '600'},
  unitMeta: {color: colors.textMuted, fontSize: typography.caption},
  action: {padding: spacing.xs},
  amenityRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  amenityHeader: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  amenityIcon: {
    alignItems: 'center',
    backgroundColor: colors.purpleSoft,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  amenityText: {flex: 1, gap: 2},
  amenityName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  amenityMeta: {color: colors.textMuted, fontSize: typography.caption},
  rules: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 17,
  },
  amenityActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
