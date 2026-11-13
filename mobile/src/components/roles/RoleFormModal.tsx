import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {validationMessage} from '@/lib/validation';
import {roleSchema, type RoleFormValues} from '@/schemas/role';
import {colors, radius, spacing, typography} from '@/theme';
import type {Permission, Role} from '@/types/role';
import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';

export function RoleFormModal({
  visible,
  role,
  permissions,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  role: Role | null;
  permissions: Permission[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void;
}) {
  const {t} = useTranslation();
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [permissionIds, setPermissionIds] = useState<string[]>(
    role?.rolePermissions?.map(item => item.permission.id) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const togglePermission = (id: string) => {
    setPermissionIds(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id],
    );
  };

  const submit = () => {
    const result = roleSchema.safeParse({
      name: name.trim(),
      description: description.trim(),
      permissionIds,
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? 'form');
        if (!next[field]) {
          next[field] = validationMessage(t, issue.message) ?? issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={role ? t('Roles.modalEditTitle') : t('Roles.modalNewTitle')}>
      <View style={styles.form}>
        <Input
          label={t('Roles.roleName')}
          value={name}
          onChangeText={setName}
          placeholder={t('Roles.roleNamePlaceholder')}
          error={errors.name}
        />
        <Input
          label={t('Roles.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('Roles.descriptionPlaceholder')}
          multiline
          error={errors.description}
        />
        <View style={styles.permissions}>
          <Text style={styles.permissionsTitle}>
            {t('Roles.defaultPermissions')}
          </Text>
          {permissions.map(permission => {
            const checked = permissionIds.includes(permission.id);
            return (
              <Pressable
                key={permission.id}
                accessibilityRole="checkbox"
                accessibilityState={{checked}}
                onPress={() => togglePermission(permission.id)}
                style={[
                  styles.permission,
                  checked && styles.permissionChecked,
                ]}>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? colors.purple : colors.textMuted}
                />
                <Text
                  style={[
                    styles.permissionLabel,
                    checked && styles.permissionLabelChecked,
                  ]}>
                  {permission.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          title={role ? t('Roles.saveChanges') : t('Roles.createRoleButton')}
          loading={pending}
          fullWidth
          onPress={submit}
        />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  form: {gap: spacing.lg, paddingTop: spacing.sm},
  permissions: {gap: spacing.sm},
  permissionsTitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  permission: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  permissionChecked: {
    backgroundColor: colors.purpleSoft,
    borderColor: 'rgba(192,132,252,0.4)',
  },
  permissionLabel: {color: colors.textSecondary, fontSize: typography.small},
  permissionLabelChecked: {color: colors.text, fontWeight: '600'},
});
