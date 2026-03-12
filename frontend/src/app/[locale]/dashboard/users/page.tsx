'use client';

import {useMemo, useState} from 'react';
import {
  User,
  Plus,
  Shield,
  Mail,
  Search,
  Trash2,
  Edit,
  Filter,
  Eye,
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Badge} from '@/components/ui/Badge';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {
  useCreateBuildingUser,
  useCreateGlobalUser,
  useDeleteUser,
  useUsers,
  useUpdateUser,
} from '@/hooks/useUsers';
import {useTranslations} from 'next-intl';
import {UserModal} from '@/components/dashboard/users/UserModal';
import {UserData} from '@/types/user';
import {UserCreateFormValues, UserEditFormValues} from '@/schemas/user';
import {useAuthStore} from '@/store/authStore';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const {data: users, isLoading} = useUsers();
  const updateMutation = useUpdateUser();
  const createGlobalMutation = useCreateGlobalUser();
  const createBuildingMutation = useCreateBuildingUser();
  const deleteMutation = useDeleteUser();
  const actor = useAuthStore(state => state.user);
  const t = useTranslations('Users');
  const tCommon = useTranslations('Common');

  const filteredUsers = useMemo(
    () =>
      users?.filter(
        u =>
          `${u.firstName} ${u.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, users],
  );

  const handleCreate = (data: UserCreateFormValues) => {
    const mutation = data.globalRole === 'SUPERADMIN'
      ? createGlobalMutation
      : createBuildingMutation;
    mutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
      onError: () => {
        alert(t('createError'));
      },
    });
  };

  const handleEdit = (data: UserEditFormValues) => {
    if (!editingUser) return;
    updateMutation.mutate(
      {
        id: editingUser.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        ...(data.password ? {passwordPlain: data.password} : {}),
        ...(data.buildingId !== undefined && {
          buildingId: data.buildingId,
          roleName: data.roleName,
          unitIds: data.unitIds ?? [],
        }),
      },
      {
        onSuccess: () => {
          setEditingUser(null);
          setIsModalOpen(false);
        },
        onError: () => {
          alert(t('updateError'));
        },
      },
    );
  };

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        <Button intent="outline" className="gap-2">
          <Filter className="w-5 h-5" />
          {tCommon('filters')}
        </Button>
        <Button
          className="gap-2 bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}>
          <Plus className="w-5 h-5" />
          {t('inviteUser')}
        </Button>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          icon={<Search className="w-5 h-5" />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingState message={t('loading')} iconClassName="text-indigo-500" />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {t('globalRole')}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers?.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/users/${user.id}`}
                      className="flex items-center gap-3 group/link">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-medium group-hover/link:text-indigo-400 transition-colors">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.globalRole}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          id: user.id,
                          isActive: !user.isActive,
                        })
                      }
                      className="cursor-pointer border-0 p-0 m-0 bg-transparent transform transition-transform hover:scale-105">
                      <Badge intent={user.isActive ? 'success' : 'danger'}>
                        {user.isActive
                          ? tCommon('active')
                          : tCommon('inactive')}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        title={tCommon('seeDetails')}>
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Button
                        intent="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() => {
                          setEditingUser(user);
                          setIsModalOpen(true);
                        }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {actor?.globalRole === 'SUPERADMIN' && (
                        <Button
                          intent="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full hover:bg-red-500/10 hover:text-red-400 text-gray-400"
                          onClick={() => {
                            if (!confirm(t('deleteConfirm'))) return;
                            deleteMutation.mutate(user.id);
                          }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredUsers?.length && (
            <div className="py-20 text-center">
              <p className="text-gray-500">{t('empty')}</p>
            </div>
          )}
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
        isPending={
          updateMutation.isPending ||
          createGlobalMutation.isPending ||
          createBuildingMutation.isPending
        }
        onCreateSubmit={handleCreate}
        onEditSubmit={handleEdit}
      />
    </div>
  );
}
