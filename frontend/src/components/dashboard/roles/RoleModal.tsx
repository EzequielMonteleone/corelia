'use client';

import {useCallback, useEffect} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {roleSchema, RoleFormValues} from '@/schemas/role';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {cn} from '@/lib/utils';
import {usePermissions} from '@/hooks/useRoles';
import {Role} from '@/types/role';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormValues) => void;
  isPending?: boolean;
  initialData?: Role | null;
}

export function RoleModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  initialData,
}: RoleModalProps) {
  const isEditing = !!initialData;
  const {data: allPermissions} = usePermissions();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: {errors},
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      permissionIds: [],
    },
  });

  const selectedPermissionIds =
    useWatch({
      control,
      name: 'permissionIds',
    }) || [];

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('description', initialData.description || '');
      setValue(
        'permissionIds',
        initialData.rolePermissions?.map(rp => rp.permission.id) || [],
      );
    } else {
      reset({
        name: '',
        description: '',
        permissionIds: [],
      });
    }
  }, [initialData, setValue, reset]);

  const togglePermission = (id: string) => {
    const current = selectedPermissionIds;
    const next = current.includes(id)
      ? current.filter(p => p !== id)
      : [...current, id];
    setValue('permissionIds', next);
  };

  const handleFormSubmit = useCallback(
    (data: RoleFormValues) => {
      onSubmit(data);
    },
    [onSubmit],
  );

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Rol' : 'Nuevo Rol'}>
      <p className="text-gray-400 mb-6 mt-[-1rem]">
        {isEditing
          ? 'Modifica los detalles del rol.'
          : 'Define un nuevo rol y selecciona los permisos básicos.'}
      </p>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Nombre del Rol
            </label>
            <Input
              {...register('name')}
              placeholder="Ej: Administrador Jr"
              error={errors.name?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Descripción
            </label>
            <textarea
              {...register('description')}
              className={cn(
                'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500/50 h-24 transition-all',
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
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-400">
            Permisos por Defecto
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {allPermissions?.map(permission => {
              const checked = selectedPermissionIds.includes(permission.id);
              return (
                <div
                  key={permission.id}
                  onClick={() => togglePermission(permission.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none',
                    checked
                      ? 'bg-purple-500/10 border-purple-500/30 text-white'
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10',
                  )}>
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center transition-all',
                      checked
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-white/20',
                    )}>
                    {checked && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{permission.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            fullWidth
            className="bg-purple-500 hover:bg-purple-600 shadow-purple-500/20"
            isLoading={isPending}>
            {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
