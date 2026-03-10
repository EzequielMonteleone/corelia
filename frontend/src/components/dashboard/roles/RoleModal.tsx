'use client';

import {useCallback, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {roleSchema, RoleFormValues} from '@/schemas/role';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {cn} from '@/lib/utils';
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: {errors},
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('description', initialData.description || '');
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
        <div className="pt-4">
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
