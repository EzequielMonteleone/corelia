import {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {AppHeader} from '@/components/layout/AppHeader';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {UserFormModal} from '@/components/users/UserFormModal';
import {UserRow} from '@/components/users/UserRow';
import {Button} from '@/components/ui/Button';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Input} from '@/components/ui/Input';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useBuildings} from '@/hooks/queries/useBuildings';
import {
  useCreateBuildingUser,
  useCreateGlobalUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/queries/useUsers';
import {useDebouncedValue} from '@/hooks/useDebouncedValue';
import {errorMessage} from '@/lib/apiError';
import {toast} from '@/store/toastStore';
import {useAuthStore} from '@/store/authStore';
import type {
  UserCreateFormValues,
  UserEditFormValues,
} from '@/schemas/user';
import type {UserData} from '@/types/user';
import {colors, spacing, typography} from '@/theme';

export default function UsersScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const actor = useAuthStore(state => state.user);
  const usersQuery = useUsers();
  const buildingsQuery = useBuildings();
  const createGlobalUser = useCreateGlobalUser();
  const createBuildingUser = useCreateBuildingUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const buildings = useMemo(
    () => buildingsQuery.data ?? [],
    [buildingsQuery.data],
  );
  const isSuperAdmin = actor?.globalRole === 'SUPERADMIN';
  const canCreate =
    isSuperAdmin ||
    buildings.some(building => (building.assignableRoles?.length ?? 0) > 0);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter(user =>
      `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(query),
    );
  }, [users, debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: UserData) => {
    setEditing(user);
    setFormOpen(true);
  };

  const createUser = (values: UserCreateFormValues) => {
    const onSuccess = () => {
      toast.success(t('Users.createSuccess'));
      setFormOpen(false);
    };
    const onError = (error: unknown) => toast.error(errorMessage(error));

    if (values.globalRole === 'SUPERADMIN') {
      createGlobalUser.mutate(values, {onSuccess, onError});
      return;
    }
    createBuildingUser.mutate(values, {onSuccess, onError});
  };

  const editUser = (values: UserEditFormValues) => {
    if (!editing) return;
    updateUser.mutate(
      {
        id: editing.id,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        ...(values.password ? {passwordPlain: values.password} : {}),
        ...(values.currentPassword
          ? {currentPassword: values.currentPassword}
          : {}),
        ...(editing.globalRole !== 'SUPERADMIN' && values.buildingId
          ? {
              buildingId: values.buildingId,
              roleName: values.roleName,
              unitIds: values.unitIds,
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success(t('Users.updateSuccess'));
          setFormOpen(false);
          setEditing(null);
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    deleteUser.mutate(userToDelete.id, {
      onSuccess: () => {
        toast.success(t('Users.deleteSuccess'));
        setUserToDelete(null);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  return (
    <RequireAccess path="/users">
      <Screen
        refreshing={usersQuery.isRefetching}
        onRefresh={() => {
          usersQuery.refetch();
          buildingsQuery.refetch();
        }}>
        <AppHeader
          title={t('Users.title')}
          subtitle={t('Users.subtitle')}
          showBell={false}
          onBack={() => router.back()}
          right={
            canCreate ? (
              <Button title={t('Users.new')} size="sm" onPress={openCreate} />
            ) : undefined
          }
        />

        {usersQuery.isLoading ? (
          <LoadingState message={t('Users.loading')} />
        ) : usersQuery.isError ? (
          <ErrorState
            message={t('Users.loadError')}
            onRetry={() => usersQuery.refetch()}
          />
        ) : (
          <View style={styles.content}>
            <Input
              placeholder={t('Users.searchPlaceholder')}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.count}>
              {t('Users.count', {count: filtered.length})}
            </Text>

            {filtered.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title={
                  users.length === 0
                    ? t('Users.emptyTitle')
                    : t('Users.noResults')
                }
                description={
                  users.length === 0
                    ? t('Users.emptyDescription')
                    : t('Users.noResultsDescription')
                }
                actionLabel={
                  users.length === 0 && canCreate
                    ? t('Users.createUser')
                    : undefined
                }
                onAction={
                  users.length === 0 && canCreate ? openCreate : undefined
                }
              />
            ) : (
              <View style={styles.list}>
                {filtered.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    canEdit={user.canEdit ?? true}
                    canDelete={user.canDelete ?? user.id !== actor?.id}
                    onPress={() =>
                      router.push({
                        pathname: '/users/[id]',
                        params: {id: user.id},
                      })
                    }
                    onEdit={() => openEdit(user)}
                    onDelete={() => setUserToDelete(user)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {actor && formOpen ? (
          <UserFormModal
            visible
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            editingUser={editing}
            actor={actor}
            buildings={buildings}
            users={users}
            pending={
              createGlobalUser.isPending ||
              createBuildingUser.isPending ||
              updateUser.isPending
            }
            onCreate={createUser}
            onEdit={editUser}
          />
        ) : null}

        <ConfirmDialog
          visible={!!userToDelete}
          title={t('Users.deleteTitle')}
          description={t('Users.deleteConfirmNamed', {
            name: `${userToDelete?.firstName ?? ''} ${userToDelete?.lastName ?? ''}`.trim(),
          })}
          confirmLabel={t('Common.delete')}
          pending={deleteUser.isPending}
          onCancel={() => setUserToDelete(null)}
          onConfirm={confirmDelete}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.md},
  count: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  list: {gap: spacing.sm},
});