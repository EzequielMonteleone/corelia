'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  Plus,
  Key,
  ChevronRight,
  Loader2,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/hooks/useRoles';
import {Role} from '@/types/role';
import {roleSchema, RoleFormValues} from '@/schemas/role';

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const {data: roles, isLoading: loadingRoles} = useRoles();
  const {data: permissions} = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(selectedRole?.id || '');
  const deleteMutation = useDeleteRole();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: {errors},
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  const onSubmit = (data: RoleFormValues) => {
    if (isEditModalOpen && selectedRole) {
      updateMutation.mutate(data, {
        onSuccess: updatedRole => {
          setIsEditModalOpen(false);
          setSelectedRole(updatedRole);
          reset();
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este rol?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSelectedRole(null);
        },
      });
    }
  };

  const handleEditClick = () => {
    if (selectedRole) {
      setValue('name', selectedRole.name);
      setValue('description', selectedRole.description || '');
      setIsEditModalOpen(true);
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Roles y Permisos
          </h1>
          <p className="text-gray-400">
            Configura los niveles de acceso y permisos granulares del sistema.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            reset();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium">
          <Plus className="w-5 h-5" />
          Crear Nuevo Rol
        </button>
      </header>

      {loadingRoles ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Cargando roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest px-2">
              Listado de Roles
            </h2>
            {roles?.map(role => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group',
                  selectedRole?.id === role.id
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
                    selectedRole?.id === role.id
                      ? 'rotate-90 text-purple-400'
                      : 'group-hover:translate-x-1',
                  )}
                />
              </div>
            ))}
          </div>

          {/* Permissions View */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
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
                    <button
                      onClick={handleEditClick}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all font-medium text-sm">
                      <Edit className="w-4 h-4" />
                      Editar Rol
                    </button>
                    <button
                      onClick={() => handleDelete(selectedRole.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl transition-all font-medium text-sm disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
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
                          className={cn(
                            'flex items-center justify-between p-4 rounded-xl border transition-all',
                            hasPermission
                              ? 'bg-purple-500/5 border-purple-500/20 text-white'
                              : 'bg-black/20 border-white/5 text-gray-600 grayscale',
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
              </div>
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

      {/* Modal for Creation/Edition */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isEditModalOpen ? 'Editar Rol' : 'Nuevo Rol'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-400 mb-6">
              {isEditModalOpen
                ? 'Modifica los detalles del rol.'
                : 'Define un nuevo rol y selecciona los permisos básicos.'}
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Nombre del Rol
                </label>
                <input
                  {...register('name')}
                  className={cn(
                    'w-full bg-white/5 border rounded-xl p-3 text-white focus:outline-none transition-all',
                    errors.name
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/10 focus:border-purple-500/50',
                  )}
                  placeholder="Ej: Administrador Jr"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Descripción
                </label>
                <textarea
                  {...register('description')}
                  className={cn(
                    'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500/50 h-24',
                    errors.description && 'border-red-500/50',
                  )}
                  placeholder="Describe brevemente el propósito de este rol..."
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Guardando...'
                    : isEditModalOpen
                      ? 'Guardar Cambios'
                      : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
