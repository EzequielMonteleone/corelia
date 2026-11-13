import {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {useBuildingUnits} from '@/hooks/queries/useBuildings';
import {validationMessage} from '@/lib/validation';
import {
  userCreateSchema,
  userEditSchema,
  type UserCreateFormValues,
  type UserEditFormValues,
} from '@/schemas/user';
import type {Building} from '@/types/building';
import type {UserData} from '@/types/user';
import {colors, radius, spacing, typography} from '@/theme';

type RoleName = 'Admin' | 'Owner' | 'Roomer';

const ROLE_LABEL_KEYS = {
  Admin: 'Users.admin',
  Owner: 'Users.owner',
  Roomer: 'Users.roomer',
} as const;

export function UserFormModal({
  visible,
  onClose,
  editingUser,
  actor,
  buildings,
  users,
  pending,
  onCreate,
  onEdit,
}: {
  visible: boolean;
  onClose: () => void;
  editingUser: UserData | null;
  actor: UserData;
  buildings: Building[];
  users: UserData[];
  pending: boolean;
  onCreate: (values: UserCreateFormValues) => void;
  onEdit: (values: UserEditFormValues) => void;
}) {
  const {t} = useTranslation();
  const [email, setEmail] = useState(editingUser?.email ?? '');
  const [firstName, setFirstName] = useState(editingUser?.firstName ?? '');
  const [lastName, setLastName] = useState(editingUser?.lastName ?? '');
  const [phone, setPhone] = useState(editingUser?.phone ?? '');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [globalSuperAdmin, setGlobalSuperAdmin] = useState(false);
  const [buildingId, setBuildingId] = useState(
    editingUser?.buildingUsers?.[0]?.buildingId ?? '',
  );
  const [roleName, setRoleName] = useState<RoleName | ''>(
    (editingUser?.buildingUsers?.[0]?.role?.name as RoleName | undefined) ?? '',
  );
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editingUser;
  const editingSelf = !!editingUser && editingUser.id === actor.id;

  const scope = useMemo(
    () => buildings.filter(building => (building.assignableRoles?.length ?? 0) > 0),
    [buildings],
  );

  const editBuildingId = editingUser?.buildingUsers?.[0]?.buildingId ?? '';
  const editRoleName = (editingUser?.buildingUsers?.[0]?.role?.name ??
    '') as RoleName | '';

  const effectiveBuildingId = buildingId || editBuildingId || scope[0]?.id || '';
  const effectiveRoleName = isEdit ? roleName || editRoleName : roleName;

  const selectedBuilding = buildings.find(
    building => building.id === effectiveBuildingId,
  );
  const {data: units = []} = useBuildingUnits(effectiveBuildingId || null);

  const roleDefinition = (selectedBuilding?.roleCatalog ?? []).find(
    role => role.name === effectiveRoleName,
  );
  const showUnitsMulti = roleDefinition?.unitSelection === 'many';
  const showUnitsSingle = roleDefinition?.unitSelection === 'one';

  const availableRoles = useMemo(() => {
    const roles = (selectedBuilding?.assignableRoles ?? []).map(role => role.name);
    if (isEdit && editRoleName && !roles.includes(editRoleName)) {
      return [editRoleName, ...roles];
    }
    return roles;
  }, [selectedBuilding, isEdit, editRoleName]);

  const effectiveSelectedUnitIds = useMemo(() => {
    if (!isEdit) return unitIds;
    if (unitIds.length > 0) return unitIds;
    return (
      editingUser?.userUnits
        ?.filter(link => link.unit?.buildingId === effectiveBuildingId)
        .map(link => link.unit?.id)
        .filter((id): id is string => Boolean(id)) ?? []
    );
  }, [isEdit, unitIds, editingUser, effectiveBuildingId]);

  const availableUnits = useMemo(() => {
    if (isEdit || !roleDefinition?.relation) return units;
    const taken = new Set(
      users.flatMap(person =>
        (person.userUnits ?? [])
          .filter(link => link.relationType === roleDefinition.relation)
          .map(link => link.unit?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    return units.filter(unit => !taken.has(unit.id));
  }, [isEdit, roleDefinition, units, users]);

  const toggleUnit = (id: string) => {
    setErrors(current => ({...current, unitIds: ''}));
    if (showUnitsSingle) {
      setUnitIds([id]);
      return;
    }
    setUnitIds(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id],
    );
  };

  const validateUnits = (): string | undefined => {
    if (globalSuperAdmin) return;
    if (showUnitsMulti && effectiveSelectedUnitIds.length === 0) {
      return t('Users.selectAtLeastOneUnit');
    }
    if (showUnitsSingle && effectiveSelectedUnitIds.length !== 1) {
      return t('Users.selectOneUnit');
    }
    return undefined;
  };

  const collectErrors = (issues: {path: PropertyKey[]; message: string}[]) => {
    const nextErrors: Record<string, string> = {};
    for (const issue of issues) {
      const field = String(issue.path[0] ?? 'form');
      if (!nextErrors[field]) {
        nextErrors[field] = validationMessage(t, issue.message) ?? issue.message;
      }
    }
    return nextErrors;
  };

  const submitCreate = () => {
    const payload: UserCreateFormValues = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      password,
      globalRole: globalSuperAdmin ? 'SUPERADMIN' : undefined,
      roleName: globalSuperAdmin
        ? undefined
        : ((effectiveRoleName || undefined) as RoleName | undefined),
      buildingId: globalSuperAdmin ? undefined : effectiveBuildingId || undefined,
      unitIds: globalSuperAdmin ? [] : effectiveSelectedUnitIds,
    };
    const result = userCreateSchema.safeParse(payload);
    const nextErrors = result.success ? {} : collectErrors(result.error.issues);
    const unitError = validateUnits();
    if (unitError) nextErrors.unitIds = unitError;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onCreate(payload);
  };

  const submitEdit = () => {
    if (!editingUser) return;
    if (editingSelf && password && !currentPassword.trim()) {
      setErrors({currentPassword: t('Users.currentPasswordRequired')});
      return;
    }
    const payload: UserEditFormValues = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      password,
      ...(editingSelf && currentPassword ? {currentPassword} : {}),
      ...(!editingSelf &&
        editingUser.globalRole !== 'SUPERADMIN' && {
          buildingId: effectiveBuildingId || undefined,
          roleName: (effectiveRoleName || undefined) as RoleName | undefined,
          unitIds: effectiveSelectedUnitIds,
        }),
    };
    const result = userEditSchema.safeParse(payload);
    const nextErrors = result.success ? {} : collectErrors(result.error.issues);
    if (
      !editingSelf &&
      editingUser.globalRole !== 'SUPERADMIN' &&
      effectiveBuildingId
    ) {
      const unitError = validateUnits();
      if (unitError) nextErrors.unitIds = unitError;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onEdit(payload);
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? t('Users.modalEditTitle') : t('Users.modalTitle')}>
      <View style={styles.form}>
        <Input
          label={t('Login.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('Users.emailPlaceholder')}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <View style={styles.row}>
          <Input
            label={t('Users.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            containerStyle={styles.rowField}
          />
          <Input
            label={t('Users.lastName')}
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            containerStyle={styles.rowField}
          />
        </View>
        <Input
          label={t('Users.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input
          label={
            isEdit ? t('Users.newPasswordOptional') : t('Users.password')
          }
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />
        {editingSelf ? (
          <Input
            label={t('Users.currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            error={errors.currentPassword}
          />
        ) : null}

        {!isEdit && actor.globalRole === 'SUPERADMIN' ? (
          <CheckRow
            checked={globalSuperAdmin}
            label={t('Users.createGlobalSuperadmin')}
            onPress={() => {
              setGlobalSuperAdmin(value => !value);
              setUnitIds([]);
              setErrors({});
            }}
          />
        ) : null}

        {!globalSuperAdmin &&
        (!isEdit ||
          (editingUser?.globalRole !== 'SUPERADMIN' && scope.length > 0)) ? (
          <>
            <Select
              label={t('Common.building')}
              value={effectiveBuildingId}
              onChange={value => {
                setBuildingId(value);
                setRoleName('');
                setUnitIds([]);
              }}
              options={scope.map(building => ({
                value: building.id,
                label: building.name,
              }))}
              error={errors.buildingId}
            />
            <Select
              label={t('Users.buildingRole')}
              value={effectiveRoleName}
              onChange={value => {
                setRoleName(value as RoleName);
                setUnitIds([]);
                setErrors(current => ({...current, roleName: ''}));
              }}
              placeholder={t('Users.selectRole')}
              options={availableRoles.map(name => ({
                value: name,
                label:
                  ROLE_LABEL_KEYS[name as keyof typeof ROLE_LABEL_KEYS]
                    ? t(ROLE_LABEL_KEYS[name as keyof typeof ROLE_LABEL_KEYS])
                    : name,
              }))}
              error={errors.roleName}
            />
            {showUnitsMulti || showUnitsSingle ? (
              <View style={styles.unitsBox}>
                <Text style={styles.unitsLabel}>
                  {showUnitsMulti
                    ? t('Users.selectOwnerUnitsFor')
                    : t('Users.selectRoomerUnitFor')}
                </Text>
                {availableUnits.length === 0 ? (
                  <Text style={styles.muted}>{t('Users.noUnits')}</Text>
                ) : (
                  availableUnits.map(unit => {
                    const checked = effectiveSelectedUnitIds.includes(unit.id);
                    return (
                      <Pressable
                        key={unit.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{checked}}
                        onPress={() => toggleUnit(unit.id)}
                        style={styles.unitRow}>
                        <Ionicons
                          name={
                            checked
                              ? showUnitsSingle
                                ? 'radio-button-on'
                                : 'checkbox'
                              : showUnitsSingle
                                ? 'radio-button-off'
                                : 'square-outline'
                          }
                          size={20}
                          color={checked ? colors.primary : colors.textMuted}
                        />
                        <Text style={styles.unitLabel}>
                          {unit.floor ? `${unit.floor} - ${unit.name}` : unit.name}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
                {errors.unitIds ? (
                  <Text style={styles.errorText}>{errors.unitIds}</Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

        <Button
          title={isEdit ? t('Users.saveChanges') : t('Users.createUser')}
          loading={pending}
          fullWidth
          onPress={isEdit ? submitEdit : submitCreate}
        />
      </View>
    </ModalSheet>
  );
}

function CheckRow({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{checked}}
      onPress={onPress}
      style={styles.checkRow}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? colors.primary : colors.textMuted}
      />
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {gap: spacing.md, paddingTop: spacing.sm},
  row: {flexDirection: 'row', gap: spacing.md},
  rowField: {flex: 1},
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkLabel: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: typography.small,
  },
  unitsBox: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  unitsLabel: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  muted: {color: colors.textMuted, fontSize: typography.small},
  unitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 34,
  },
  unitLabel: {color: colors.text, fontSize: typography.small},
  errorText: {color: colors.danger, fontSize: typography.caption},
});