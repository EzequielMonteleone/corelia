import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation();
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
            toast.success(t('Roles.updateSuccess'));
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
        toast.success(t('Roles.createSuccess'));
        setFormOpen(false);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  const confirmDelete = () => {
    if (!roleToDelete) return;
    deleteRole.mutate(roleToDelete.id, {
      onSuccess: () => {
        toast.success(t('Roles.deleteSuccess'));
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
          title={t('Roles.title')}
          subtitle={t('Roles.subtitle')}
          showBell={false}
          onBack={() => router.back()}
          right={
            <Button title={t('Roles.new')} size="sm" onPress={openCreate} />
          }
        />

        {rolesQuery.isLoading ? (
          <LoadingState message={t('Roles.loading')} />
        ) : rolesQuery.isError ? (
          <ErrorState
            message={t('Roles.loadError')}
            onRetry={() => rolesQuery.refetch()}
          />
        ) : roles.length === 0 ? (
          <EmptyState
            icon="key-outline"
            title={t('Roles.emptyTitle')}
            description={t('Roles.emptyDescription')}
            actionLabel={t('Roles.createRoleButtonMobile')}
            onAction={openCreate}
          />
        ) : (
          <Section title={t('Roles.listTitle', {count: roles.length})}>
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
                        {role.description || t('Common.noDescription')}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('Roles.editRoleAccessibility', {
                          name: role.name,
                        })}
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
                        accessibilityLabel={t('Roles.deleteRoleAccessibility', {
                          name: role.name,
                        })}
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
                      <Text style={styles.muted}>{t('Roles.noPermissions')}</Text>
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
          title={t('Roles.deleteTitle')}
          description={t('Roles.deleteConfirmNamed', {
            name: roleToDelete?.name ?? '',
          })}
          confirmLabel={t('Common.delete')}
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