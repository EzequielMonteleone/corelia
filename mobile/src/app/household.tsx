import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {Section} from '@/components/layout/Section';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {
  HouseholdRecordRow,
} from '@/components/household/HouseholdRecordRow';
import {
  MemberForm,
  PetForm,
  VehicleForm,
} from '@/components/household/HouseholdForms';
import {Button} from '@/components/ui/Button';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Select} from '@/components/ui/Select';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {useBuildingUnits} from '@/hooks/queries/useBuildings';
import {
  useCreateMember,
  useCreatePet,
  useCreateVehicle,
  useDeleteMember,
  useDeletePet,
  useDeleteVehicle,
  useHousehold,
  useUpdateMember,
  useUpdatePet,
  useUpdateVehicle,
} from '@/hooks/queries/useHousehold';
import {errorMessage} from '@/lib/apiError';
import {toast} from '@/store/toastStore';
import type {
  HouseholdDeleteTarget,
  HouseholdEditor,
  HouseholdMemberInput,
  HouseholdRelation,
  PetInput,
  PetSpecies,
  VehicleInput,
} from '@/types/household';
import {colors, spacing, typography} from '@/theme';

const RELATION_LABELS: Record<HouseholdRelation, string> = {
  SPOUSE: 'Cónyuge',
  CHILD: 'Hijo/a',
  PARENT: 'Padre/madre',
  OTHER: 'Otro',
};

const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

function vehicleLabel(vehicle: {
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
}) {
  return [vehicle.plate, vehicle.make, vehicle.model, vehicle.color]
    .filter(Boolean)
    .join(' · ');
}

export default function HouseholdScreen() {
  const router = useRouter();
  const {
    buildings,
    activeBuildingId,
    setSelectedBuildingId,
    isLoading: loadingBuildings,
    isRefetching: buildingsRefetching,
    isError: buildingsError,
    refetch: refetchBuildings,
  } = useActiveBuilding();
  const unitsQuery = useBuildingUnits(activeBuildingId);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [editor, setEditor] = useState<HouseholdEditor | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<HouseholdDeleteTarget | null>(null);

  const units = unitsQuery.data ?? [];
  const unitId = selectedUnitId || (units.length === 1 ? units[0].id : '');
  const householdQuery = useHousehold(unitId || null);
  const household = householdQuery.data;

  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const createPet = useCreatePet();
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();

  const saving =
    createMember.isPending ||
    updateMember.isPending ||
    createVehicle.isPending ||
    updateVehicle.isPending ||
    createPet.isPending ||
    updatePet.isPending;
  const deleting =
    deleteMember.isPending || deleteVehicle.isPending || deletePet.isPending;

  const saveMember = async (input: HouseholdMemberInput) => {
    if (!unitId) return;
    try {
      if (editor?.kind === 'member' && editor.record) {
        await updateMember.mutateAsync({id: editor.record.id, ...input});
      } else {
        await createMember.mutateAsync({unitId, ...input});
      }
      toast.success('Integrante guardado correctamente.');
      setEditor(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const saveVehicle = async (input: VehicleInput) => {
    if (!unitId) return;
    try {
      if (editor?.kind === 'vehicle' && editor.record) {
        await updateVehicle.mutateAsync({id: editor.record.id, ...input});
      } else {
        await createVehicle.mutateAsync({unitId, ...input});
      }
      toast.success('Vehículo guardado correctamente.');
      setEditor(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const savePet = async (input: PetInput) => {
    if (!unitId) return;
    try {
      if (editor?.kind === 'pet' && editor.record) {
        await updatePet.mutateAsync({id: editor.record.id, ...input});
      } else {
        await createPet.mutateAsync({unitId, ...input});
      }
      toast.success('Mascota guardada correctamente.');
      setEditor(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !unitId) return;
    try {
      if (pendingDelete.kind === 'member') {
        await deleteMember.mutateAsync({id: pendingDelete.id, unitId});
      } else if (pendingDelete.kind === 'vehicle') {
        await deleteVehicle.mutateAsync({id: pendingDelete.id, unitId});
      } else {
        await deletePet.mutateAsync({id: pendingDelete.id, unitId});
      }
      toast.success('Registro eliminado correctamente.');
      setPendingDelete(null);
      setEditor(current =>
        current?.record?.id === pendingDelete.id ? null : current,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const editorTitle = editor
    ? editor.record
      ? editor.kind === 'member'
        ? 'Editar integrante'
        : editor.kind === 'vehicle'
          ? 'Editar vehículo'
          : 'Editar mascota'
      : editor.kind === 'member'
        ? 'Nuevo integrante'
        : editor.kind === 'vehicle'
          ? 'Nuevo vehículo'
          : 'Nueva mascota'
    : '';

  if (loadingBuildings) {
    return (
      <RequireAccess path="/household">
        <Screen>
          <AppHeader
            title="Grupo familiar"
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message="Cargando grupo familiar..." />
        </Screen>
      </RequireAccess>
    );
  }

  if (buildingsError) {
    return (
      <RequireAccess path="/household">
        <Screen>
          <AppHeader
            title="Grupo familiar"
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message="No pudimos cargar tus edificios."
            onRetry={() => refetchBuildings()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  return (
    <RequireAccess path="/household">
      <Screen
        refreshing={buildingsRefetching || householdQuery.isRefetching}
        onRefresh={() => {
          refetchBuildings();
          unitsQuery.refetch();
          householdQuery.refetch();
        }}>
        <AppHeader
          title="Grupo familiar"
          subtitle="Integrantes, vehículos y mascotas de tu unidad."
          showBell={false}
          onBack={() => router.back()}
        />

        <BuildingSwitcher
          buildings={buildings}
          value={activeBuildingId}
          onChange={value => {
            setSelectedBuildingId(value);
            setSelectedUnitId('');
            setEditor(null);
          }}
        />

        {!activeBuildingId ? (
          <EmptyState
            icon="people-outline"
            title="Elegí un edificio"
            description="Seleccioná un edificio para ver el grupo familiar."
          />
        ) : unitsQuery.isLoading ? (
          <LoadingState message="Cargando unidades..." />
        ) : units.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="Sin unidades disponibles"
            description="No tenés unidades vinculadas en este edificio."
          />
        ) : (
          <View style={styles.content}>
            {units.length > 1 ? (
              <Select
                label="Unidad"
                value={unitId}
                onChange={value => {
                  setSelectedUnitId(value);
                  setEditor(null);
                }}
                placeholder="Seleccionar unidad"
                options={units.map(unit => ({
                  label: unit.floor
                    ? `${unit.name} · Piso ${unit.floor}`
                    : unit.name,
                  value: unit.id,
                }))}
              />
            ) : (
              <View style={styles.singleUnit}>
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.singleUnitText}>
                  Unidad {units[0].name}
                </Text>
              </View>
            )}

            {!unitId ? (
              <EmptyState
                icon="home-outline"
                title="Elegí una unidad"
                description="Seleccioná la unidad para ver su grupo familiar."
              />
            ) : householdQuery.isLoading ? (
              <LoadingState message="Cargando grupo familiar..." />
            ) : householdQuery.isError ? (
              <ErrorState
                message="No pudimos cargar el grupo familiar."
                onRetry={() => householdQuery.refetch()}
              />
            ) : household ? (
              <>
                <Section
                  title="Integrantes"
                  action={
                    <Button
                      title="Agregar"
                      size="sm"
                      onPress={() => setEditor({kind: 'member', record: null})}
                    />
                  }>
                  {household.members.length === 0 ? (
                    <Text style={styles.muted}>
                      Todavía no cargaste integrantes.
                    </Text>
                  ) : (
                    <View style={styles.list}>
                      {household.members.map(member => (
                        <HouseholdRecordRow
                          key={member.id}
                          icon="person-outline"
                          title={`${member.firstName} ${member.lastName}`}
                          subtitle={[
                            RELATION_LABELS[member.relation],
                            member.documentNumber
                              ? `DNI ${member.documentNumber}`
                              : null,
                            member.phone,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          onEdit={() =>
                            setEditor({kind: 'member', record: member})
                          }
                          onDelete={() =>
                            setPendingDelete({
                              kind: 'member',
                              id: member.id,
                              label: `${member.firstName} ${member.lastName}`,
                            })
                          }
                        />
                      ))}
                    </View>
                  )}
                </Section>

                <Section
                  title="Vehículos"
                  action={
                    <Button
                      title="Agregar"
                      size="sm"
                      onPress={() => setEditor({kind: 'vehicle', record: null})}
                    />
                  }>
                  {household.vehicles.length === 0 ? (
                    <Text style={styles.muted}>
                      No hay vehículos registrados.
                    </Text>
                  ) : (
                    <View style={styles.list}>
                      {household.vehicles.map(vehicle => (
                        <HouseholdRecordRow
                          key={vehicle.id}
                          icon="car-outline"
                          title={vehicle.plate}
                          subtitle={vehicleLabel(vehicle)}
                          onEdit={() =>
                            setEditor({kind: 'vehicle', record: vehicle})
                          }
                          onDelete={() =>
                            setPendingDelete({
                              kind: 'vehicle',
                              id: vehicle.id,
                              label: vehicle.plate,
                            })
                          }
                        />
                      ))}
                    </View>
                  )}
                </Section>

                <Section
                  title="Mascotas"
                  action={
                    <Button
                      title="Agregar"
                      size="sm"
                      onPress={() => setEditor({kind: 'pet', record: null})}
                    />
                  }>
                  {household.pets.length === 0 ? (
                    <Text style={styles.muted}>No hay mascotas registradas.</Text>
                  ) : (
                    <View style={styles.list}>
                      {household.pets.map(pet => (
                        <HouseholdRecordRow
                          key={pet.id}
                          icon="paw-outline"
                          title={pet.name}
                          subtitle={[SPECIES_LABELS[pet.species], pet.notes]
                            .filter(Boolean)
                            .join(' · ')}
                          onEdit={() => setEditor({kind: 'pet', record: pet})}
                          onDelete={() =>
                            setPendingDelete({
                              kind: 'pet',
                              id: pet.id,
                              label: pet.name,
                            })
                          }
                        />
                      ))}
                    </View>
                  )}
                </Section>
              </>
            ) : null}
          </View>
        )}

        <ModalSheet
          visible={!!editor}
          onClose={() => setEditor(null)}
          title={editorTitle}>
          {editor?.kind === 'member' ? (
            <MemberForm
              key={`member-${editor.record?.id ?? 'new'}`}
              initial={editor.record}
              pending={saving}
              onCancel={() => setEditor(null)}
              onSubmit={saveMember}
            />
          ) : null}
          {editor?.kind === 'vehicle' ? (
            <VehicleForm
              key={`vehicle-${editor.record?.id ?? 'new'}`}
              initial={editor.record}
              pending={saving}
              onCancel={() => setEditor(null)}
              onSubmit={saveVehicle}
            />
          ) : null}
          {editor?.kind === 'pet' ? (
            <PetForm
              key={`pet-${editor.record?.id ?? 'new'}`}
              initial={editor.record}
              pending={saving}
              onCancel={() => setEditor(null)}
              onSubmit={savePet}
            />
          ) : null}
        </ModalSheet>

        <ConfirmDialog
          visible={!!pendingDelete}
          title="Eliminar registro"
          description={`¿Seguro que querés eliminar ${pendingDelete?.label ?? 'este registro'}?`}
          confirmLabel="Eliminar"
          pending={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xl},
  singleUnit: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  singleUnitText: {color: colors.textSecondary, fontSize: typography.small},
  list: {gap: spacing.sm},
  muted: {color: colors.textMuted, fontSize: typography.small, lineHeight: 18},
});
