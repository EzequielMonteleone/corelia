import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {roleSchema, type RoleFormValues} from '@/schemas/role';
import type {Permission, Role} from '@/types/role';
import {colors, radius, spacing, typography} from '@/theme';

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
        if (!next[field]) next[field] = issue.message;
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
      title={role ? 'Editar rol' : 'Nuevo rol'}>
      <View style={styles.form}>
        <Input
          label="Nombre del rol"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Administrador Jr"
          error={errors.name}
        />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe brevemente el propósito de este rol..."
          multiline
          error={errors.description}
        />
        <View style={styles.permissions}>
          <Text style={styles.permissionsTitle}>Permisos por defecto</Text>
          {permissions.map(permission => {
            const checked = permissionIds.includes(permission.id);
            return (
              <Pressable
                key={permission.id}
                accessibilityRole="checkbox"
                accessibilityState={{checked}}
                onPress={() => togglePermission(permission.id)}
                style={[styles.permission, checked && styles.permissionChecked]}>
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
          title={role ? 'Guardar cambios' : 'Crear rol'}
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
