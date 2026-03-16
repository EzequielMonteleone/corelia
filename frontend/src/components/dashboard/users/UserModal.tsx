'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {
  userCreateSchema,
  userEditSchema,
  type UserCreateFormValues,
  type UserEditFormValues,
} from '@/schemas/user';
import {useAuthStore} from '@/store/authStore';
import {useBuildings, useBuildingUnits} from '@/hooks/useBuildings';
import {useUsers} from '@/hooks/useUsers';
import {UserData} from '@/types/user';
import {useTranslations} from 'next-intl';

const emptyCreateValues: UserCreateFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  password: '',
  roleName: undefined,
  globalRole: undefined,
  buildingId: undefined,
  unitIds: [],
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubmit: (data: UserCreateFormValues) => void;
  onEditSubmit: (data: UserEditFormValues) => void;
  isPending?: boolean;
  editingUser?: UserData | null;
}

export function UserModal({
  isOpen,
  onClose,
  onCreateSubmit,
  onEditSubmit,
  isPending,
  editingUser,
}: UserModalProps) {
  const t = useTranslations('Users');
  const actor = useAuthStore(state => state.user);
  const {data: buildings = []} = useBuildings();
  const {data: users = []} = useUsers();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[] | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<
    'Admin' | 'Owner' | 'Roomer' | '' | null
  >(null);
  const [isGlobalSuperAdminCreate, setIsGlobalSuperAdminCreate] =
    useState(false);
  const isEdit = !!editingUser;

  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: emptyCreateValues,
  });
  const editForm = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
    },
  });

  const actorBuildingScope = useMemo(() => {
    if (!actor) return [];
    if (actor.globalRole === 'SUPERADMIN') {
      return buildings;
    }
    return buildings.filter(building =>
      actor.buildingUsers.some(
        bu =>
          bu.buildingId === building.id &&
          (bu.role?.name === 'Admin' || bu.role?.name === 'Owner'),
      ),
    );
  }, [actor, buildings]);

  const editBuildingId = useMemo(
    () =>
      (isEdit && editingUser?.buildingUsers?.[0]
        ? editingUser.buildingUsers[0].buildingId
        : '') || '',
    [isEdit, editingUser],
  );

  const effectiveBuildingId = useMemo(
    () =>
      (selectedBuildingId ?? (isEdit ? editBuildingId : '')) ||
      actorBuildingScope[0]?.id ||
      '',
    [selectedBuildingId, isEdit, editBuildingId, actorBuildingScope],
  );

  const {data: units = []} = useBuildingUnits(effectiveBuildingId || null);

  const editRoleName = useMemo(
    () =>
      (editingUser?.buildingUsers?.[0]?.role?.name as
        | 'Admin'
        | 'Owner'
        | 'Roomer'
        | '') || '',
    [editingUser],
  );

  const effectiveRoleName = isEdit
    ? (selectedRoleName ?? editRoleName)
    : (selectedRoleName ?? '');

  const editUnitIdsForBuilding = useMemo(
    () =>
      editingUser?.userUnits
        ?.filter(uu => uu.unit?.buildingId === effectiveBuildingId)
        .map(uu => uu.unit!.id) ?? [],
    [editingUser, effectiveBuildingId],
  );

  const effectiveSelectedUnitIds = useMemo(
    () =>
      isEdit
        ? (selectedUnitIds ?? editUnitIdsForBuilding)
        : (selectedUnitIds ?? []),
    [isEdit, selectedUnitIds, editUnitIdsForBuilding],
  );

  const occupiedUnitIds = useMemo(
    () =>
      new Set(
        users.flatMap(user =>
          (user.userUnits ?? [])
            .map(({unit}) => unit?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [users],
  );

  const availableUnits = useMemo(() => {
    if (isEdit) return units;
    return units.filter(unit => !occupiedUnitIds.has(unit.id));
  }, [units, occupiedUnitIds, isEdit]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && editingUser) {
      editForm.reset({
        email: editingUser.email,
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        phone: editingUser.phone ?? '',
        password: '',
      });
      return;
    }

    createForm.reset(emptyCreateValues);
  }, [isOpen, isEdit, editingUser, editForm, createForm, actorBuildingScope]);

  useEffect(() => {
    if (isEdit) return;
    createForm.setValue('unitIds', selectedUnitIds ?? []);
    createForm.setValue('buildingId', effectiveBuildingId || undefined);
    createForm.setValue('roleName', (selectedRoleName ?? '') || undefined);
  }, [
    isEdit,
    createForm,
    selectedUnitIds,
    effectiveBuildingId,
    selectedRoleName,
  ]);

  useEffect(() => {
    if (isEdit) return;
    if (isGlobalSuperAdminCreate) {
      createForm.setValue('globalRole', 'SUPERADMIN');
      createForm.setValue('roleName', undefined);
      createForm.setValue('buildingId', undefined);
      createForm.setValue('unitIds', []);
      return;
    }
    createForm.setValue('globalRole', undefined);
  }, [createForm, isEdit, isGlobalSuperAdminCreate]);

  const availableRoles = useMemo(() => {
    if (!actor) return [];
    if (actor.globalRole === 'SUPERADMIN') return ['Admin'];
    const currentBuildingRole = actor.buildingUsers.find(
      bu => bu.buildingId === effectiveBuildingId,
    )?.role?.name;
    let roles: string[] = [];
    if (currentBuildingRole === 'Admin') roles = ['Owner'];
    if (currentBuildingRole === 'Owner') roles = ['Roomer'];
    if (isEdit && editingUser?.buildingUsers?.[0]?.role?.name) {
      const currentUserRole = editingUser.buildingUsers[0].role!.name;
      if (!roles.includes(currentUserRole)) roles = [currentUserRole, ...roles];
    }
    return roles;
  }, [actor, effectiveBuildingId, isEdit, editingUser]);

  const modalTitle = isEdit ? t('modalEditTitle') : t('modalTitle');

  const handleCreate = useCallback(
    (data: UserCreateFormValues) => {
      onCreateSubmit({
        ...data,
        roleName: isGlobalSuperAdminCreate ? undefined : data.roleName,
        globalRole: isGlobalSuperAdminCreate ? 'SUPERADMIN' : undefined,
        unitIds: isGlobalSuperAdminCreate ? [] : (selectedUnitIds ?? []),
        buildingId: isGlobalSuperAdminCreate
          ? undefined
          : data.buildingId || effectiveBuildingId || undefined,
      });
    },
    [
      onCreateSubmit,
      isGlobalSuperAdminCreate,
      selectedUnitIds,
      effectiveBuildingId,
    ],
  );

  const handleEdit = useCallback(
    (data: UserEditFormValues) => {
      const payload: UserEditFormValues = {
        ...data,
        ...(editingUser?.globalRole !== 'SUPERADMIN' && {
          buildingId: effectiveBuildingId || undefined,
          roleName: effectiveRoleName || undefined,
          unitIds: effectiveSelectedUnitIds,
        }),
      };
      onEditSubmit(payload);
    },
    [
      onEditSubmit,
      editingUser?.globalRole,
      effectiveBuildingId,
      effectiveRoleName,
      effectiveSelectedUnitIds,
    ],
  );

  const handleClose = useCallback(() => {
    setSelectedBuildingId(null);
    setSelectedUnitIds(null);
    setSelectedRoleName(null);
    setIsGlobalSuperAdminCreate(false);
    onClose();
  }, [onClose]);

  const showUnitsMulti = effectiveRoleName === 'Owner';
  const showUnitsSingle = effectiveRoleName === 'Roomer';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      {isEdit ? (
        <form
          onSubmit={editForm.handleSubmit(handleEdit)}
          className="space-y-4">
          <Input
            {...editForm.register('email')}
            error={editForm.formState.errors.email?.message}
            placeholder={t('emailPlaceholder')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...editForm.register('firstName')}
              error={editForm.formState.errors.firstName?.message}
              placeholder={t('firstName')}
            />
            <Input
              {...editForm.register('lastName')}
              error={editForm.formState.errors.lastName?.message}
              placeholder={t('lastName')}
            />
          </div>
          <Input
            {...editForm.register('phone')}
            error={editForm.formState.errors.phone?.message}
            placeholder={t('phone')}
          />
          <Input
            type="password"
            {...editForm.register('password')}
            error={editForm.formState.errors.password?.message}
            placeholder={t('newPasswordOptional')}
          />

          {editingUser?.globalRole !== 'SUPERADMIN' &&
            actorBuildingScope.length > 0 && (
              <>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  value={effectiveBuildingId}
                  onChange={e => {
                    setSelectedBuildingId(e.target.value);
                    setSelectedUnitIds([]);
                  }}>
                  {actorBuildingScope.map(building => (
                    <option
                      key={building.id}
                      value={building.id}
                      className="bg-[#121212] text-white">
                      {building.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  value={effectiveRoleName}
                  onChange={e => {
                    setSelectedRoleName(
                      e.target.value as 'Admin' | 'Owner' | 'Roomer' | '',
                    );
                    setSelectedUnitIds([]);
                  }}>
                  <option value="" className="bg-[#121212]">
                    {t('selectRole')}
                  </option>
                  {availableRoles.map(roleName => (
                    <option
                      key={roleName}
                      value={roleName}
                      className="bg-[#121212] text-white">
                      {roleName}
                    </option>
                  ))}
                </select>

                {showUnitsMulti && (
                  <div className="space-y-2 rounded-xl border border-white/10 p-3">
                    <p className="text-sm text-gray-300">
                      {t('selectOwnerUnits')}
                    </p>
                    {units.map(unit => (
                      <label
                        key={unit.id}
                        className="flex items-center gap-2 text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={effectiveSelectedUnitIds.includes(unit.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedUnitIds(prev => [
                                ...(prev ?? []),
                                unit.id,
                              ]);
                            } else {
                              setSelectedUnitIds(prev =>
                                (prev ?? []).filter(id => id !== unit.id),
                              );
                            }
                          }}
                        />
                        {unit.floor
                          ? `${unit.floor} - ${unit.name}`
                          : unit.name}
                      </label>
                    ))}
                  </div>
                )}

                {showUnitsSingle && (
                  <div className="space-y-2 rounded-xl border border-white/10 p-3">
                    <p className="text-sm text-gray-300">
                      {t('selectRoomerUnit')}
                    </p>
                    {units.map(unit => (
                      <label
                        key={unit.id}
                        className="flex items-center gap-2 text-sm text-gray-200">
                        <input
                          type="radio"
                          name="roomer-unit-edit"
                          checked={effectiveSelectedUnitIds[0] === unit.id}
                          onChange={() => setSelectedUnitIds([unit.id])}
                        />
                        {unit.floor
                          ? `${unit.floor} - ${unit.name}`
                          : unit.name}
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

          <Button type="submit" fullWidth isLoading={isPending}>
            {t('saveChanges')}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={createForm.handleSubmit(handleCreate)}
          className="space-y-4">
          <Input
            {...createForm.register('email')}
            error={createForm.formState.errors.email?.message}
            placeholder={t('emailPlaceholder')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...createForm.register('firstName')}
              error={createForm.formState.errors.firstName?.message}
              placeholder={t('firstName')}
            />
            <Input
              {...createForm.register('lastName')}
              error={createForm.formState.errors.lastName?.message}
              placeholder={t('lastName')}
            />
          </div>
          <Input
            {...createForm.register('phone')}
            error={createForm.formState.errors.phone?.message}
            placeholder={t('phone')}
          />
          <Input
            type="password"
            {...createForm.register('password')}
            error={createForm.formState.errors.password?.message}
            placeholder={t('passwordPlaceholder')}
          />

          {actor?.globalRole === 'SUPERADMIN' && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={isGlobalSuperAdminCreate}
                onChange={e => {
                  setIsGlobalSuperAdminCreate(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedRoleName('Admin');
                  } else {
                    setSelectedRoleName('');
                    setSelectedUnitIds([]);
                  }
                }}
              />
              {t('createGlobalSuperadmin')}
            </label>
          )}

          {!isGlobalSuperAdminCreate && (
            <>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                value={effectiveBuildingId}
                onChange={e => {
                  setSelectedBuildingId(e.target.value);
                  setSelectedUnitIds([]);
                }}>
                {actorBuildingScope.map(building => (
                  <option
                    key={building.id}
                    value={building.id}
                    className="bg-[#121212] text-white">
                    {building.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                value={effectiveRoleName}
                onChange={e => {
                  setSelectedRoleName(
                    e.target.value as 'Admin' | 'Owner' | 'Roomer' | '',
                  );
                  setSelectedUnitIds([]);
                }}>
                <option value="" className="bg-[#121212]">
                  {t('selectRole')}
                </option>
                {availableRoles.map(roleName => (
                  <option
                    key={roleName}
                    value={roleName}
                    className="bg-[#121212] text-white">
                    {roleName}
                  </option>
                ))}
              </select>
            </>
          )}

          {showUnitsMulti && (
            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <p className="text-sm text-gray-300">{t('selectOwnerUnits')}</p>
              {availableUnits.map(unit => (
                <label
                  key={unit.id}
                  className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={effectiveSelectedUnitIds.includes(unit.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedUnitIds(prev => [...(prev ?? []), unit.id]);
                      } else {
                        setSelectedUnitIds(prev =>
                          (prev ?? []).filter(id => id !== unit.id),
                        );
                      }
                    }}
                  />
                  {unit.floor ? `${unit.floor} - ${unit.name}` : unit.name}
                </label>
              ))}
            </div>
          )}

          {showUnitsSingle && (
            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <p className="text-sm text-gray-300">{t('selectRoomerUnit')}</p>
              {availableUnits.map(unit => (
                <label
                  key={unit.id}
                  className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="radio"
                    name="roomer-unit"
                    checked={effectiveSelectedUnitIds[0] === unit.id}
                    onChange={() => setSelectedUnitIds([unit.id])}
                  />
                  {unit.floor ? `${unit.floor} - ${unit.name}` : unit.name}
                </label>
              ))}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isPending}>
            {t('createUser')}
          </Button>
        </form>
      )}
    </Modal>
  );
}
