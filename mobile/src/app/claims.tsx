import {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {ClaimCard} from '@/components/claims/ClaimCard';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Select} from '@/components/ui/Select';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {
  useBuildingAmenities,
  useBuildingUnits,
} from '@/hooks/queries/useBuildings';
import {useClaims, useCreateClaim, useUpdateClaim} from '@/hooks/queries/useClaims';
import {errorMessage} from '@/lib/apiError';
import {toast} from '@/store/toastStore';
import type {ClaimUpdateInput} from '@/types/claims';
import {colors, spacing, typography} from '@/theme';

type TargetOption = {value: string; label: string};

export default function ClaimsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{buildingId?: string; claimId?: string}>();
  const {
    buildings,
    activeBuildingId,
    setSelectedBuildingId,
    isLoading: loadingBuildings,
    isRefetching: buildingsRefetching,
    isError: buildingsError,
    refetch: refetchBuildings,
  } = useActiveBuilding();

  const [filtersByBuilding, setFiltersByBuilding] = useState<
    Record<string, string>
  >({});
  const [createOpen, setCreateOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.buildingId) setSelectedBuildingId(params.buildingId);
  }, [params.buildingId, setSelectedBuildingId]);

  const filter = activeBuildingId
    ? (filtersByBuilding[activeBuildingId] ?? 'all')
    : 'all';
  const setFilter = (value: string) => {
    if (!activeBuildingId) return;
    setFiltersByBuilding(current => ({
      ...current,
      [activeBuildingId]: value,
    }));
  };

  const unitsQuery = useBuildingUnits(activeBuildingId);
  const amenitiesQuery = useBuildingAmenities(activeBuildingId);
  const filterUnitId = filter.startsWith('unit:') ? filter.slice(5) : null;
  const filterAmenityId = filter.startsWith('amenity:') ? filter.slice(8) : null;
  const claimsQuery = useClaims(activeBuildingId, {
    unitId: filterUnitId,
    buildingAmenityId: filterAmenityId,
  });
  const createClaim = useCreateClaim();
  const updateClaim = useUpdateClaim();

  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const amenities = useMemo(
    () =>
      (amenitiesQuery.data?.amenities ?? []).filter(item => item.isEnabled),
    [amenitiesQuery.data],
  );
  const claims = claimsQuery.data?.claims ?? [];
  const canCreate = !!claimsQuery.data?.canCreate;
  const canCreateAmenity = !!claimsQuery.data?.canCreateAmenity;
  const canViewAmenityClaims = !!claimsQuery.data?.canViewAmenityClaims;

  const filterOptions = useMemo<TargetOption[]>(() => {
    const options: TargetOption[] = [{value: 'all', label: 'Todos los reclamos'}];
    units.forEach(unit => {
      options.push({value: `unit:${unit.id}`, label: `Unidad ${unit.name}`});
    });
    if (canViewAmenityClaims) {
      amenities.forEach(item => {
        options.push({
          value: `amenity:${item.id}`,
          label: `Amenity ${item.amenity.name}`,
        });
      });
    }
    return options;
  }, [units, amenities, canViewAmenityClaims]);

  const createTargetOptions = useMemo<TargetOption[]>(() => {
    const options: TargetOption[] = [];
    if (canCreate) {
      units.forEach(unit => {
        options.push({value: `unit:${unit.id}`, label: `Unidad ${unit.name}`});
      });
    }
    if (canCreateAmenity) {
      amenities.forEach(item => {
        options.push({
          value: `amenity:${item.id}`,
          label: `Amenity ${item.amenity.name}`,
        });
      });
    }
    return options;
  }, [units, amenities, canCreate, canCreateAmenity]);

  const openCreate = () => {
    setCreateTarget(createTargetOptions[0]?.value ?? '');
    setTitle('');
    setBody('');
    setErrors({});
    setCreateOpen(true);
  };

  const submit = () => {
    if (!activeBuildingId) return;
    const nextErrors: Record<string, string> = {};
    if (!createTarget) nextErrors.target = 'Seleccioná una unidad o amenity.';
    if (!title.trim()) nextErrors.title = 'Ingresá un título.';
    if (!body.trim()) nextErrors.body = 'Ingresá una descripción.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const isUnit = createTarget.startsWith('unit:');
    const isAmenity = createTarget.startsWith('amenity:');
    createClaim.mutate(
      {
        buildingId: activeBuildingId,
        ...(isUnit ? {unitId: createTarget.slice(5)} : {}),
        ...(isAmenity ? {buildingAmenityId: createTarget.slice(8)} : {}),
        title: title.trim(),
        body: body.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Reclamo creado correctamente.');
          setCreateOpen(false);
        },
        onError: error => setErrors({form: errorMessage(error)}),
      },
    );
  };

  const saveClaim = (claimId: string, input: ClaimUpdateInput) => {
    updateClaim.mutate(
      {id: claimId, ...input},
      {
        onSuccess: () => toast.success('Reclamo actualizado correctamente.'),
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const refreshAll = () => {
    refetchBuildings();
    claimsQuery.refetch();
    unitsQuery.refetch();
    amenitiesQuery.refetch();
  };

  if (loadingBuildings) {
    return (
      <RequireAccess path="/claims">
        <Screen>
          <AppHeader title="Reclamos" showBell={false} onBack={() => router.back()} />
          <LoadingState message="Cargando reclamos..." />
        </Screen>
      </RequireAccess>
    );
  }

  if (buildingsError) {
    return (
      <RequireAccess path="/claims">
        <Screen>
          <AppHeader title="Reclamos" showBell={false} onBack={() => router.back()} />
          <ErrorState
            message="No pudimos cargar tus edificios."
            onRetry={() => refetchBuildings()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  const showCreate = canCreate || canCreateAmenity;

  return (
    <RequireAccess path="/claims">
      <Screen
        refreshing={buildingsRefetching || claimsQuery.isRefetching}
        onRefresh={refreshAll}>
        <AppHeader
          title="Reclamos"
          subtitle="Reportá y seguí incidencias del edificio."
          showBell={false}
          onBack={() => router.back()}
          right={
            showCreate ? (
              <Button title="Nuevo" size="sm" onPress={openCreate} />
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
            icon="chatbox-ellipses-outline"
            title="Elegí un edificio"
            description="Seleccioná un edificio para ver sus reclamos."
          />
        ) : claimsQuery.isLoading ? (
          <LoadingState message="Cargando reclamos..." />
        ) : claimsQuery.isError ? (
          <ErrorState
            message="No pudimos cargar los reclamos."
            onRetry={() => claimsQuery.refetch()}
          />
        ) : (
          <View style={styles.content}>
            {filterOptions.length > 1 ? (
              <Select
                label="Filtrar por"
                value={filter}
                onChange={setFilter}
                options={filterOptions}
              />
            ) : null}

            {claims.length === 0 ? (
              <EmptyState
                icon="chatbox-ellipses-outline"
                title="Sin reclamos"
                description={
                  showCreate
                    ? 'Creá el primer reclamo del edificio.'
                    : 'No hay reclamos para el filtro seleccionado.'
                }
                actionLabel={showCreate ? 'Crear reclamo' : undefined}
                onAction={showCreate ? openCreate : undefined}
              />
            ) : (
              <View style={styles.list}>
                {claims.map(claim => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    pending={updateClaim.isPending}
                    highlighted={claim.id === params.claimId}
                    onSave={input => saveClaim(claim.id, input)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <ModalSheet
          visible={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Nuevo reclamo">
          <View style={styles.form}>
            <Select
              label="Sobre"
              value={createTarget}
              onChange={value => {
                setCreateTarget(value);
                if (errors.target) {
                  setErrors(current => ({...current, target: ''}));
                }
              }}
              placeholder="Seleccionar unidad o amenity"
              options={createTargetOptions}
              error={errors.target || undefined}
            />
            <Input
              label="Título"
              value={title}
              onChangeText={value => {
                setTitle(value);
                if (errors.title) {
                  setErrors(current => ({...current, title: ''}));
                }
              }}
              placeholder="Resumen del reclamo"
              error={errors.title || undefined}
            />
            <Input
              label="Descripción"
              value={body}
              onChangeText={value => {
                setBody(value);
                if (errors.body) {
                  setErrors(current => ({...current, body: ''}));
                }
              }}
              placeholder="Contanos qué pasó..."
              multiline
              error={errors.body || undefined}
            />
            {errors.form ? (
              <Text style={styles.formError}>{errors.form}</Text>
            ) : null}
            <Button
              title="Crear reclamo"
              loading={createClaim.isPending}
              fullWidth
              onPress={submit}
            />
          </View>
        </ModalSheet>
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.lg},
  list: {gap: spacing.md},
  form: {gap: spacing.lg, paddingTop: spacing.sm},
  formError: {color: colors.danger, fontSize: typography.caption},
});
