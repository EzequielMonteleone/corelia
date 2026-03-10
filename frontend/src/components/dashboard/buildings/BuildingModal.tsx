'use client';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {buildingSchema, BuildingFormValues} from '@/schemas/building';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {useCallback} from 'react';
import {useTranslations} from 'next-intl';

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BuildingFormValues) => void;
  isPending?: boolean;
}

export function BuildingModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: BuildingModalProps) {
  const t = useTranslations('Buildings');
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
  });

  const handleFormSubmit = useCallback(
    (data: BuildingFormValues) => {
      onSubmit(data);
    },
    [onSubmit],
  );

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('modalTitle')}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            {t('name')}
          </label>
          <Input
            {...register('name')}
            error={errors.name?.message}
            placeholder={t('namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            {t('address')}
          </label>
          <Input
            {...register('address')}
            error={errors.address?.message}
            placeholder={t('addressPlaceholder')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              {t('city')}
            </label>
            <Input
              {...register('city')}
              error={errors.city?.message}
              placeholder={t('cityPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              {t('country')}
            </label>
            <Input
              {...register('country')}
              error={errors.country?.message}
              placeholder={t('countryPlaceholder')}
            />
          </div>
        </div>
        <div className="pt-4">
          <Button type="submit" fullWidth isLoading={isPending}>
            {t('registerBuilding')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
