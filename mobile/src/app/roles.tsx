import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {Section} from '@/components/layout/Section';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {RoleFormModal} from '@/components/roles/RoleFormModal';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useUpdateRole,
} from '@/hooks/queries/useRoles';
import {errorMessage} from '@/lib/apiError';
import {toast} from '@/store/toastStore';
import type {RoleFormValues} from '@/schemas/role';
import type {Role} from '@/types/role';
import {colors, radius, spacing, typography} from '@/theme';

export default function RolesScreen() {
  const router = useRouter();
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setFormOpen(true);
  };

  const submit = (values: RoleFormValues) => {
    if (editing) {
      updateRole.mutate(
        {id: editing.id, ...values},
        {
          onSuccess: () => {
            toast.success('Rol actualizado correctamente.');
            setFormOpen(false);
            setEditing(null);
          },
          onError: error => toast.error(errorMessage(error)),
        },
      );
      return;
    }
    createRole.mutate(values, {
      onSuccess: () => {
        toast.success('Rol creado correctamente.');
        setFormOpen(false);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  const confirmDelete = () => {
    if (!roleToDelete) return;
    deleteRole.mutate(roleToDelete.id, {
      onSuccess: () => {
        toast.success('Rol eliminado correctamente.');
        setRoleToDelete(null);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  return (
    <RequireAccess path="/roles">
      <Screen
        refreshing={rolesQuery.isRefetching}
        onRefresh={() => {
          rolesQuery.refetch();
          permissionsQuery.refetch();
        }}>
        <AppHeader
          title="Roles y permisos"
          subtitle="Niveles de acceso y permisos del sistema."
          showBell={false}
          onBack={() => router.back()}
          right={
            <Button title="Nuevo" size="sm" onPress={openCreate} />
          }
        />

        {rolesQuery.isLoading ? (
          <LoadingState message="Cargando roles..." />
        ) : rolesQuery.isError ? (
          <ErrorState
            message="No pudimos cargar los roles."
            onRetry={() => rolesQuery.refetch()}
          />
        ) : roles.length === 0 ? (
          <EmptyState
            icon="key-outline"
            title="Sin roles"
            description="Creá el primer rol para asignar permisos."
            actionLabel="Crear rol"
            onAction={openCreate}
          />
        ) : (
          <Section title={`Roles (${roles.length})`}>
            <View style={styles.list}>
              {roles.map(role => (
                <Card key={role.id} style={styles.card}>
                  <View style={styles.header}>
                    <View style={styles.icon}>
                      <Ionicons name="key-outline" size={18} color={colors.purple} />
                    </View>
                    <View style={styles.text}>
                      <Text style={styles.name}>{role.name}</Text>
                      <Text style={styles.description}>
                        {role.description || 'Sin descripción'}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Editar rol ${role.name}`}
                        hitSlop={6}
                        onPress={() => openEdit(role)}
                        style={styles.action}>
                        <Ionicons
                          name="pencil-outline"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar rol ${role.name}`}
                        hitSlop={6}
                        onPress={() => setRoleToDelete(role)}
                        style={styles.action}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.danger}
                        />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.permissions}>
                    {role.rolePermissions.length === 0 ? (
                      <Text style={styles.muted}>Sin permisos asignados.</Text>
                    ) : (
                      role.rolePermissions.slice(0, 6).map(item => (
                        <Badge
                          key={item.permission.id}
                          label={item.permission.name}
                          intent="purple"
                        />
                      ))
                    )}
                    {role.rolePermissions.length > 6 ? (
                      <Badge
                        label={`+${role.rolePermissions.length - 6}`}
                        intent="default"
                      />
                    ) : null}
                  </View>
                </Card>
              ))}
            </View>
          </Section>
        )}

        {formOpen ? (
          <RoleFormModal
            visible
            role={editing}
            permissions={permissions}
            pending={createRole.isPending || updateRole.isPending}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSubmit={submit}
          />
        ) : null}

        <ConfirmDialog
          visible={!!roleToDelete}
          title="Eliminar rol"
          description={`¿Seguro que querés eliminar el rol ${roleToDelete?.name ?? ''}? Los usuarios que lo tengan asignado perderán esos permisos.`}
          confirmLabel="Eliminar"
          pending={deleteRole.isPending}
          onCancel={() => setRoleToDelete(null)}
          onConfirm={confirmDelete}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  list: {gap: spacing.md},
  card: {gap: spacing.md, padding: spacing.md},
  header: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  icon: {
    alignItems: 'center',
    backgroundColor: colors.purpleSoft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  text: {flex: 1, gap: 2},
  name: {color: colors.text, fontSize: typography.body, fontWeight: '700'},
  description: {color: colors.textMuted, fontSize: typography.caption},
  actions: {flexDirection: 'row', gap: spacing.xs},
  action: {padding: spacing.xs},
  permissions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  muted: {color: colors.textMuted, fontSize: typography.caption},
});
