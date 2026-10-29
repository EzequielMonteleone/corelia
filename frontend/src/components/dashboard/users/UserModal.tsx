'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
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

  const actorBuildingScope = useMemo(
    () =>
      buildings.filter(building => (building.assignableRoles?.length ?? 0) > 0),
    [buildings],
  );

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

  const selectedBuilding = buildings.find(
    building => building.id === effectiveBuildingId,
  );
  const roleCatalog =
    selectedBuilding?.roleCatalog ?? buildings[0]?.roleCatalog ?? [];
  const selectedRole = roleCatalog.find(role => role.name === effectiveRoleName);

  const availableUnits = useMemo(() => {
    if (isEdit || !selectedRole?.relation) return units;
    const taken = new Set(
      users.flatMap(person =>
        (person.userUnits ?? [])
          .filter(link => link.relationType === selectedRole.relation)
          .map(link => link.unit?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    return units.filter(unit => !taken.has(unit.id));
  }, [isEdit, selectedRole?.relation, units, users]);

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
    const roles =
      selectedBuilding?.assignableRoles?.map(role => role.name) ?? [];
    const current = editingUser?.buildingUsers?.[0]?.role?.name;
    if (
      isEdit &&
      current &&
      !roles.includes(current as (typeof roles)[number])
    ) {
      return [current, ...roles];
    }
    return roles;
  }, [selectedBuilding, isEdit, editingUser]);

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

  const editingSelf = Boolean(
    actor && editingUser && actor.id === editingUser.id,
  );

  const handleEdit = useCallback(
    (data: UserEditFormValues) => {
      if (editingSelf && data.password && !data.currentPassword?.trim()) {
        editForm.setError('currentPassword', {
          message: t('currentPasswordRequired'),
        });
        return;
      }
      const payload: UserEditFormValues = {
        ...data,
        ...(!editingSelf &&
          editingUser?.globalRole !== 'SUPERADMIN' && {
            buildingId: effectiveBuildingId || undefined,
            roleName: effectiveRoleName || undefined,
            unitIds: effectiveSelectedUnitIds,
          }),
      };
      onEditSubmit(payload);
    },
    [
      onEditSubmit,
      editingSelf,
      editingUser?.globalRole,
      effectiveBuildingId,
      effectiveRoleName,
      effectiveSelectedUnitIds,
      editForm,
      t,
    ],
  );

  const handleClose = useCallback(() => {
    setSelectedBuildingId(null);
    setSelectedUnitIds(null);
    setSelectedRoleName(null);
    setIsGlobalSuperAdminCreate(false);
    onClose();
  }, [onClose]);

  const showUnitsMulti = selectedRole?.unitSelection === 'many';
  const showUnitsSingle = selectedRole?.unitSelection === 'one';

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
          {editingSelf && (
            <Input
              type="password"
              {...editForm.register('currentPassword')}
              error={editForm.formState.errors.currentPassword?.message}
              placeholder={t('currentPassword')}
            />
          )}

          {!editingSelf &&
            editingUser?.globalRole !== 'SUPERADMIN' &&
            actorBuildingScope.length > 0 && (
              <>
                <Select
                  value={effectiveBuildingId}
                  onChange={e => {
                    setSelectedBuildingId(e.target.value);
                    setSelectedUnitIds([]);
                  }}>
                  {actorBuildingScope.map(building => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </Select>

                <Select
                  value={effectiveRoleName}
                  onChange={e => {
                    setSelectedRoleName(
                      e.target.value as 'Admin' | 'Owner' | 'Roomer' | '',
                    );
                    setSelectedUnitIds([]);
                  }}>
                  <option value="">{t('selectRole')}</option>
                  {availableRoles.map(roleName => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </Select>

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
              <Select
                value={effectiveBuildingId}
                onChange={e => {
                  setSelectedBuildingId(e.target.value);
                  setSelectedUnitIds([]);
                }}>
                {actorBuildingScope.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>

              <Select
                value={effectiveRoleName}
                onChange={e => {
                  setSelectedRoleName(
                    e.target.value as 'Admin' | 'Owner' | 'Roomer' | '',
                  );
                  setSelectedUnitIds([]);
                }}>
                <option value="">{t('selectRole')}</option>
                {availableRoles.map(roleName => (
                  <option key={roleName} value={roleName}>
                    {roleName}
                  </option>
                ))}
              </Select>
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
