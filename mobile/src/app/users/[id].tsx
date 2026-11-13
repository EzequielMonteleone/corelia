import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {Section} from '@/components/layout/Section';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {UserFormModal} from '@/components/users/UserFormModal';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useBuildings} from '@/hooks/queries/useBuildings';
import {
  useDeleteUser,
  useUpdateUser,
  useUser,
  useUserAuditLogs,
  useUsers,
} from '@/hooks/queries/useUsers';
import {isUserAuditAction} from '@/types/user';
import {errorMessage} from '@/lib/apiError';
import {formatDateTime, initials} from '@/lib/format';
import {toast} from '@/store/toastStore';
import {useAuthStore} from '@/store/authStore';
import type {UserAuditMetadata} from '@/types/user';
import type {UserEditFormValues} from '@/schemas/user';
import {colors, radius, spacing, typography} from '@/theme';

const ACTION_LABELS: Record<string, string> = {
  USER_PASSWORD_CHANGED: 'Cambió su contraseña',
  USER_PASSWORD_RESET: 'Se restableció la contraseña',
  USER_ROLE_CHANGED: 'Cambió el rol o las unidades',
  USER_ACTIVE_CHANGED: 'Cambió el estado de la cuenta',
};

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrador',
  Owner: 'Propietario',
  Roomer: 'Inquilino',
};

const RELATION_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ROOMER: 'Inquilino',
};

function auditDescription(metadata: UserAuditMetadata | null) {
  if (!metadata) return null;
  if (metadata.previousRole !== undefined || metadata.nextRole) {
    return [metadata.previousRole ?? 'Sin rol', metadata.nextRole]
      .filter(Boolean)
      .join(' → ');
  }
  if (metadata.isActive !== undefined) {
    return metadata.isActive ? 'Cuenta activada' : 'Cuenta desactivada';
  }
  return null;
}

export default function UserDetailScreen() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const userId = id ?? null;
  const actor = useAuthStore(state => state.user);
  const userQuery = useUser(userId);
  const auditQuery = useUserAuditLogs(userId);
  const usersQuery = useUsers();
  const buildingsQuery = useBuildings();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const user = userQuery.data;

  const editUser = (values: UserEditFormValues) => {
    if (!user) return;
    updateUser.mutate(
      {
        id: user.id,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        ...(values.password ? {passwordPlain: values.password} : {}),
        ...(values.currentPassword
          ? {currentPassword: values.currentPassword}
          : {}),
        ...(user.globalRole !== 'SUPERADMIN' && values.buildingId
          ? {
              buildingId: values.buildingId,
              roleName: values.roleName,
              unitIds: values.unitIds,
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado correctamente.');
          setFormOpen(false);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const confirmDelete = () => {
    if (!user) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('Usuario eliminado correctamente.');
        setDeleteOpen(false);
        router.back();
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  if (userQuery.isLoading) {
    return (
      <RequireAccess path="/users">
        <Screen>
          <AppHeader
            title="Detalle de usuario"
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message="Cargando usuario..." />
        </Screen>
      </RequireAccess>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <RequireAccess path="/users">
        <Screen>
          <AppHeader
            title="Detalle de usuario"
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message="No pudimos cargar el usuario."
            onRetry={() => userQuery.refetch()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  const auditLogs = auditQuery.data ?? [];

  return (
    <RequireAccess path="/users">
      <Screen
        refreshing={userQuery.isRefetching || auditQuery.isRefetching}
        onRefresh={() => {
          userQuery.refetch();
          auditQuery.refetch();
        }}>
        <AppHeader
          title="Detalle de usuario"
          subtitle={user.email}
          showBell={false}
          onBack={() => router.back()}
          right={
            user.canEdit ? (
              <Button title="Editar" size="sm" onPress={() => setFormOpen(true)} />
            ) : undefined
          }
        />

        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials(user.firstName, user.lastName)}
            </Text>
          </View>
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          <View style={styles.badges}>
            <Badge
              label={user.isActive ? 'Activo' : 'Inactivo'}
              intent={user.isActive ? 'success' : 'danger'}
            />
            <Badge
              label={user.globalRole === 'SUPERADMIN' ? 'Superadmin' : 'Usuario'}
              intent={user.globalRole === 'SUPERADMIN' ? 'purple' : 'default'}
            />
            {user.buildingUsers?.[0]?.role?.name ? (
              <Badge
                label={
                  ROLE_LABELS[user.buildingUsers[0].role.name] ??
                  user.buildingUsers[0].role.name
                }
                intent="primary"
              />
            ) : null}
          </View>
        </Card>

        <View style={styles.content}>
          <Section title="Edificios y roles">
            {(user.buildingUsers ?? []).length === 0 ? (
              <Text style={styles.muted}>
                Este usuario no tiene edificios asignados.
              </Text>
            ) : (
              <View style={styles.list}>
                {user.buildingUsers.map(link => (
                  <View key={link.id} style={styles.row}>
                    <View style={styles.rowIcon}>
                      <Ionicons
                        name="business-outline"
                        size={17}
                        color={colors.indigo}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>
                        {link.building?.name ?? 'Edificio'}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {link.role
                          ? (ROLE_LABELS[link.role.name] ?? link.role.name)
                          : 'Sin rol'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section title="Unidades">
            {(user.userUnits ?? []).length === 0 ? (
              <Text style={styles.muted}>Sin unidades asignadas.</Text>
            ) : (
              <View style={styles.list}>
                {user.userUnits?.map(link => (
                  <View key={link.id} style={styles.row}>
                    <View style={styles.rowIcon}>
                      <Ionicons
                        name="home-outline"
                        size={17}
                        color={colors.success}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>
                        {link.unit?.name ?? 'Unidad'}
                        {link.unit?.floor ? ` · Piso ${link.unit.floor}` : ''}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {RELATION_LABELS[link.relationType] ?? link.relationType}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section title="Actividad">
            {auditQuery.isLoading ? (
              <LoadingState message="Cargando actividad..." />
            ) : auditLogs.length === 0 ? (
              <Text style={styles.muted}>
                Todavía no hay cambios de acceso.
              </Text>
            ) : (
              <View style={styles.list}>
                {auditLogs.map(log => {
                  const label = isUserAuditAction(log.action)
                    ? ACTION_LABELS[log.action]
                    : log.action;
                  const detail = auditDescription(log.metadata);
                  return (
                    <View key={log.id} style={styles.auditRow}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                      <View style={styles.rowText}>
                        <Text style={styles.auditTitle}>{label}</Text>
                        {detail ? (
                          <Text style={styles.rowMeta}>{detail}</Text>
                        ) : null}
                        <Text style={styles.rowMeta}>
                          {formatDateTime(log.createdAt)}
                          {log.actorName ? ` · ${log.actorName}` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Section>

          {user.canDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar usuario"
              onPress={() => setDeleteOpen(true)}
              style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Eliminar usuario</Text>
            </Pressable>
          ) : null}
        </View>

        {actor && formOpen ? (
          <UserFormModal
            visible
            onClose={() => setFormOpen(false)}
            editingUser={user}
            actor={actor}
            buildings={buildingsQuery.data ?? []}
            users={usersQuery.data ?? []}
            pending={updateUser.isPending}
            onCreate={() => {}}
            onEdit={editUser}
          />
        ) : null}

        <ConfirmDialog
          visible={deleteOpen}
          title="Eliminar usuario"
          description={`¿Seguro que querés eliminar a ${user.firstName} ${user.lastName}? Se revocarán todos sus accesos.`}
          confirmLabel="Eliminar"
          pending={deleteUser.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  identity: {alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 64,
  },
  avatarText: {color: colors.indigo, fontSize: typography.h1, fontWeight: '800'},
  name: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '800',
    textAlign: 'center',
  },
  email: {color: colors.textMuted, fontSize: typography.small},
  phone: {color: colors.textSecondary, fontSize: typography.small},
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  content: {gap: spacing.xl, marginTop: spacing.xl},
  list: {gap: spacing.sm},
  row: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rowText: {flex: 1, gap: 2},
  rowTitle: {color: colors.text, fontSize: typography.small, fontWeight: '600'},
  rowMeta: {color: colors.textMuted, fontSize: typography.caption},
  muted: {color: colors.textMuted, fontSize: typography.small, lineHeight: 18},
  auditRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  auditTitle: {color: colors.text, fontSize: typography.small, fontWeight: '600'},
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  deleteText: {color: colors.danger, fontSize: typography.body, fontWeight: '600'},
  pressed: {opacity: 0.8},
});
