'use client';

import {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Car, PawPrint, Users} from 'lucide-react';
import {toast} from 'sonner';
import {errorCode} from '@/lib/apiError';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card, CardContent} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {Select} from '@/components/ui/Select';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {
  MemberForm,
  PetForm,
  VehicleForm,
} from '@/components/dashboard/household/HouseholdForms';
import {HouseholdRecordRow} from '@/components/dashboard/household/HouseholdRecordRow';
import {HouseholdSection} from '@/components/dashboard/household/HouseholdSection';
import {useBuildingUnits, useBuildings} from '@/hooks/useBuildings';
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
} from '@/hooks/useHousehold';
import {
  HouseholdDeleteTarget,
  HouseholdEditor,
  HouseholdMemberInput,
  HouseholdRelation,
  PetInput,
  PetSpecies,
  Vehicle,
  VehicleInput,
} from '@/types/household';

function vehicleLabel(vehicle: Vehicle) {
  return [vehicle.plate, vehicle.make, vehicle.model].filter(Boolean).join(' · ');
}

export default function HouseholdPage() {
  const t = useTranslations('Household');
  const tCommon = useTranslations('Common');
  const {data: buildings = [], isLoading: loadingBuildings} = useBuildings();
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [editor, setEditor] = useState<HouseholdEditor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HouseholdDeleteTarget | null>(null);

  const activeBuildingId = useMemo(
    () => selectedBuildingId || (buildings.length === 1 ? buildings[0].id : ''),
    [buildings, selectedBuildingId],
  );
  const {data: units = [], isLoading: loadingUnits} = useBuildingUnits(
    activeBuildingId || null,
  );
  const unitId = selectedUnitId || (units.length === 1 ? units[0].id : '');
  const {data: household, isLoading: loadingHousehold} = useHousehold(unitId || null);

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

  const toastSaveError = (error: unknown) => {
    const code = errorCode(error);
    if (code === 'PLATE_TAKEN') toast.error(t('plateTaken'));
    else if (code === 'INVALID_HOUSEHOLD') toast.error(t('invalid'));
    else if (code === 'UNIT_NOT_LINKED') toast.error(t('unitNotLinked'));
    else if (code === 'INSUFFICIENT_PERMISSIONS') toast.error(t('forbidden'));
    else toast.error(t('saveError'));
  };

  const saveMember = (input: HouseholdMemberInput) => {
    if (!unitId) return;
    const request = editor?.kind === 'member' && editor.record
      ? updateMember.mutateAsync({id: editor.record.id, ...input})
      : createMember.mutateAsync({unitId, ...input});
    request
      .then(() => {
        toast.success(t('saveSuccess'));
        setEditor(null);
      })
      .catch(toastSaveError);
  };

  const saveVehicle = (input: VehicleInput) => {
    if (!unitId) return;
    const request = editor?.kind === 'vehicle' && editor.record
      ? updateVehicle.mutateAsync({id: editor.record.id, ...input})
      : createVehicle.mutateAsync({unitId, ...input});
    request
      .then(() => {
        toast.success(t('saveSuccess'));
        setEditor(null);
      })
      .catch(toastSaveError);
  };

  const savePet = (input: PetInput) => {
    if (!unitId) return;
    const request = editor?.kind === 'pet' && editor.record
      ? updatePet.mutateAsync({id: editor.record.id, ...input})
      : createPet.mutateAsync({unitId, ...input});
    request
      .then(() => {
        toast.success(t('saveSuccess'));
        setEditor(null);
      })
      .catch(toastSaveError);
  };

  const confirmDelete = () => {
    if (!pendingDelete || !unitId) return;
    const request =
      pendingDelete.kind === 'member'
        ? deleteMember.mutateAsync({id: pendingDelete.id, unitId})
        : pendingDelete.kind === 'vehicle'
          ? deleteVehicle.mutateAsync({id: pendingDelete.id, unitId})
          : deletePet.mutateAsync({id: pendingDelete.id, unitId});
    request
      .then(() => {
        toast.success(t('deleteSuccess'));
        setPendingDelete(null);
        setEditor(current =>
          current?.record?.id === pendingDelete.id ? null : current,
        );
      })
      .catch(() => toast.error(t('deleteError')));
  };

  const isLoading = loadingBuildings || (!!activeBuildingId && loadingUnits);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        <div className="flex flex-col gap-3 sm:flex-row">
          {buildings.length > 1 && (
            <Select
              className="w-56 shrink-0"
              value={activeBuildingId}
              onChange={event => {
                setSelectedBuildingId(event.target.value);
                setSelectedUnitId('');
                setEditor(null);
              }}>
              <option value="">{t('selectBuilding')}</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </Select>
          )}
          {units.length > 1 && (
            <Select
              className="w-48 shrink-0"
              value={unitId}
              onChange={event => {
                setSelectedUnitId(event.target.value);
                setEditor(null);
              }}>
              <option value="">{t('selectUnit')}</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </PageHeader>

      {isLoading ? (
        <LoadingState message={t('loading')} />
      ) : !activeBuildingId ? (
        <Card>
          <CardContent className="p-8 text-gray-400">{t('selectBuilding')}</CardContent>
        </Card>
      ) : !unitId ? (
        <Card>
          <CardContent className="p-8 text-gray-400">{t('selectUnit')}</CardContent>
        </Card>
      ) : loadingHousehold || !household ? (
        <LoadingState message={t('loading')} />
      ) : (
        <div className="grid gap-6">
          <HouseholdSection
            icon={<Users className="h-5 w-5 text-blue-400" />}
            title={t('members')}
            addLabel={t('addMember')}
            adding={editor?.kind === 'member' && !editor.record}
            onAdd={() => setEditor({kind: 'member', record: null})}>
            {editor?.kind === 'member' && (
              <MemberForm
                key={editor.record?.id ?? 'new-member'}
                initial={editor.record}
                pending={saving}
                onCancel={() => setEditor(null)}
                onSubmit={saveMember}
              />
            )}
            {household.members.length === 0 && editor?.kind !== 'member' && (
              <p className="text-sm text-gray-500">{t('membersEmpty')}</p>
            )}
            <ul className="space-y-3">
              {household.members.map(member => (
                <HouseholdRecordRow
                  key={member.id}
                  title={`${member.firstName} ${member.lastName}`}
                  meta={[
                    t(`relations.${member.relation as HouseholdRelation}`),
                    member.documentNumber,
                    member.phone,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  editLabel={t('edit')}
                  deleteLabel={tCommon('delete')}
                  onEdit={() => setEditor({kind: 'member', record: member})}
                  onDelete={() =>
                    setPendingDelete({
                      kind: 'member',
                      id: member.id,
                      label: `${member.firstName} ${member.lastName}`,
                    })
                  }
                />
              ))}
            </ul>
          </HouseholdSection>

          <HouseholdSection
            icon={<Car className="h-5 w-5 text-blue-400" />}
            title={t('vehicles')}
            addLabel={t('addVehicle')}
            adding={editor?.kind === 'vehicle' && !editor.record}
            onAdd={() => setEditor({kind: 'vehicle', record: null})}>
            {editor?.kind === 'vehicle' && (
              <VehicleForm
                key={editor.record?.id ?? 'new-vehicle'}
                initial={editor.record}
                pending={saving}
                onCancel={() => setEditor(null)}
                onSubmit={saveVehicle}
              />
            )}
            {household.vehicles.length === 0 && editor?.kind !== 'vehicle' && (
              <p className="text-sm text-gray-500">{t('vehiclesEmpty')}</p>
            )}
            <ul className="space-y-3">
              {household.vehicles.map(vehicle => (
                <HouseholdRecordRow
                  key={vehicle.id}
                  title={vehicle.plate}
                  meta={[vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(' · ')}
                  editLabel={t('edit')}
                  deleteLabel={tCommon('delete')}
                  onEdit={() => setEditor({kind: 'vehicle', record: vehicle})}
                  onDelete={() =>
                    setPendingDelete({
                      kind: 'vehicle',
                      id: vehicle.id,
                      label: vehicleLabel(vehicle),
                    })
                  }
                />
              ))}
            </ul>
          </HouseholdSection>

          <HouseholdSection
            icon={<PawPrint className="h-5 w-5 text-blue-400" />}
            title={t('pets')}
            addLabel={t('addPet')}
            adding={editor?.kind === 'pet' && !editor.record}
            onAdd={() => setEditor({kind: 'pet', record: null})}>
            {editor?.kind === 'pet' && (
              <PetForm
                key={editor.record?.id ?? 'new-pet'}
                initial={editor.record}
                pending={saving}
                onCancel={() => setEditor(null)}
                onSubmit={savePet}
              />
            )}
            {household.pets.length === 0 && editor?.kind !== 'pet' && (
              <p className="text-sm text-gray-500">{t('petsEmpty')}</p>
            )}
            <ul className="space-y-3">
              {household.pets.map(pet => (
                <HouseholdRecordRow
                  key={pet.id}
                  title={pet.name}
                  badge={t(`species.${pet.species as PetSpecies}`)}
                  meta={pet.notes ?? ''}
                  editLabel={t('edit')}
                  deleteLabel={tCommon('delete')}
                  onEdit={() => setEditor({kind: 'pet', record: pet})}
                  onDelete={() =>
                    setPendingDelete({kind: 'pet', id: pet.id, label: pet.name})
                  }
                />
              ))}
            </ul>
          </HouseholdSection>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDescription', {name: pendingDelete?.label ?? ''})}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
        isPending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
