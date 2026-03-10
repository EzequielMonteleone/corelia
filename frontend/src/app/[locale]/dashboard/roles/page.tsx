'use client';

import {useCallback, useState} from 'react';
import {
  ShieldCheck,
  Plus,
  Key,
  ChevronRight,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {RoleModal} from '@/components/dashboard/roles/RoleModal';
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/hooks/useRoles';
import {Role} from '@/types/role';
import {RoleFormValues} from '@/schemas/role';

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const {data: roles, isLoading: loadingRoles} = useRoles();
  const {data: permissions} = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const selectedRole = roles?.find(r => r.id === selectedRoleId) || null;

  const handleOpenCreateModal = useCallback(() => {
    setEditingRole(null);
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const handleOpenEditModal = useCallback(() => {
    if (selectedRole) {
      setEditingRole(selectedRole);
      setIsModalOpen(true);
    }
  }, [selectedRole]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRole(null);
  }, [setIsModalOpen]);

  const onSubmit = useCallback(
    (data: RoleFormValues) => {
      if (editingRole) {
        updateMutation.mutate(
          {id: editingRole.id, ...data},
          {
            onSuccess: () => {
              handleCloseModal();
            },
          },
        );
      } else {
        createMutation.mutate(data, {
          onSuccess: () => {
            handleCloseModal();
          },
        });
      }
    },
    [createMutation, updateMutation, editingRole, handleCloseModal],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('¿Estás seguro de que deseas eliminar este rol?')) {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            setSelectedRoleId(null);
          },
        });
      }
    },
    [deleteMutation],
  );

  const togglePermission = useCallback(
    (permissionId: string) => {
      if (!selectedRole) return;

      const currentPermissionIds =
        selectedRole.rolePermissions?.map(rp => rp.permission.id) || [];
      const hasPermission = currentPermissionIds.includes(permissionId);

      const newPermissionIds = hasPermission
        ? currentPermissionIds.filter(id => id !== permissionId)
        : [...currentPermissionIds, permissionId];

      updateMutation.mutate({
        id: selectedRole.id,
        name: selectedRole.name,
        description: selectedRole.description,
        permissionIds: newPermissionIds,
      });
    },
    [selectedRole, updateMutation],
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Roles y Permisos"
        description="Configura los niveles de acceso y permisos granulares del sistema."
        titleClassName="tracking-tight"
        className="mb-12">
        <Button
          onClick={handleOpenCreateModal}
          className="gap-2 bg-purple-500 hover:bg-purple-600 shadow-purple-500/20">
          <Plus className="w-5 h-5" />
          Crear Nuevo Rol
        </Button>
      </PageHeader>

      {loadingRoles ? (
        <LoadingState
          message="Cargando roles..."
          iconClassName="text-purple-500"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest px-2">
              Listado de Roles
            </h2>
            {roles?.map(role => (
              <Card
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  'p-5 cursor-pointer flex justify-between items-center group',
                  selectedRoleId === role.id
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20',
                )}>
                <div>
                  <h3
                    className={cn(
                      'font-bold text-lg mb-1',
                      selectedRole?.id === role.id
                        ? 'text-purple-400'
                        : 'text-white group-hover:text-purple-400',
                    )}>
                    {role.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {role.description || 'Sin descripción'}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    'w-5 h-5 transition-transform',
                    selectedRoleId === role.id
                      ? 'rotate-90 text-purple-400'
                      : 'group-hover:translate-x-1',
                  )}
                />
              </Card>
            ))}
          </div>

          {/* Permissions View */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <Card className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedRole.name}
                      </h2>
                    </div>
                    <p className="text-gray-400">
                      {selectedRole.description ||
                        'Este rol no tiene una descripción definida.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      intent="outline"
                      onClick={handleOpenEditModal}
                      className="gap-2 text-sm">
                      <Edit className="w-4 h-4" />
                      Editar Rol
                    </Button>
                    <Button
                      intent="destructive"
                      onClick={() => handleDelete(selectedRole.id)}
                      disabled={deleteMutation.isPending}
                      className="gap-2 text-sm">
                      <Trash2 className="w-4 h-4" />
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-widest">
                    <Key className="w-4 h-4 text-purple-500" />
                    Permisos Asignados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions?.map(permission => {
                      const hasPermission = selectedRole.rolePermissions?.some(
                        rp => rp.permission.id === permission.id,
                      );
                      return (
                        <div
                          key={permission.id}
                          onClick={() => togglePermission(permission.id)}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none',
                            hasPermission
                              ? 'bg-purple-500/5 border-purple-500/20 text-white hover:bg-purple-500/10'
                              : 'bg-black/20 border-white/5 text-gray-600 grayscale hover:grayscale-0 hover:border-white/20',
                            updateMutation.isPending &&
                              'opacity-50 pointer-events-none',
                          )}>
                          <div>
                            <div className="font-semibold text-sm">
                              {permission.name}
                            </div>
                          </div>
                          {hasPermission ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-700" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center">
                <div className="p-4 bg-white/5 rounded-full mb-4">
                  <ShieldCheck className="w-12 h-12 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">
                  Selecciona un Rol
                </h3>
                <p className="text-gray-500 max-w-xs">
                  Haz clic en un rol del listado para ver y gestionar sus
                  permisos específicos.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <RoleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={onSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingRole}
      />
    </div>
  );
}
