'use client';

import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {useProfile, useUpdateUser} from '@/hooks/useUsers';
import {errorCode} from '@/lib/apiError';
import {profileSchema, type ProfileFormValues} from '@/schemas/user';
import {useAuthStore} from '@/store/authStore';

const labelClass = 'text-xs font-medium text-gray-400';

export default function ProfilePage() {
  const t = useTranslations('Users');
  const tLogin = useTranslations('Login');
  const tProfile = useTranslations('Profile');
  const {data: profile, isLoading, isError} = useProfile();
  const updateUser = useUpdateUser();
  const patchUser = useAuthStore(state => state.patchUser);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      currentPassword: '',
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? '',
      password: '',
      currentPassword: '',
    });
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    if (!profile) return;
    if (data.password && !data.currentPassword?.trim()) {
      form.setError('currentPassword', {
        message: t('currentPasswordRequired'),
      });
      return;
    }

    updateUser.mutate(
      {
        id: profile.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        ...(data.password ? {passwordPlain: data.password} : {}),
        ...(data.password && data.currentPassword
          ? {currentPassword: data.currentPassword}
          : {}),
      },
      {
        onSuccess: updated => {
          patchUser({
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phone: updated.phone || undefined,
          });
          form.reset({
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phone: updated.phone ?? '',
            password: '',
            currentPassword: '',
          });
          toast.success(t('updateSuccess'));
        },
        onError: error => {
          const code = errorCode(error);
          if (
            code === 'INVALID_CURRENT_PASSWORD' ||
            code === 'CURRENT_PASSWORD_REQUIRED' ||
            code === 'PASSWORD_TOO_SHORT' ||
            code === 'INSUFFICIENT_PERMISSIONS' ||
            code === 'EMAIL_ALREADY_EXISTS'
          ) {
            toast.error(t(code));
            return;
          }
          toast.error(t('updateError'));
        },
      },
    );
  };

  return (
    <div className="p-8">
      <PageHeader
        title={tProfile('title')}
        description={tProfile('description')}
      />
      {isLoading ? (
        <LoadingState message={tProfile('loading')} />
      ) : isError || !profile ? (
        <p className="text-gray-400">{t('notFound')}</p>
      ) : (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="block space-y-1.5">
            <span className={labelClass}>{tLogin('email')}</span>
            <Input
              type="email"
              placeholder={t('emailPlaceholder')}
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className={labelClass}>{t('firstName')}</span>
              <Input
                {...form.register('firstName')}
                error={form.formState.errors.firstName?.message}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>{t('lastName')}</span>
              <Input
                {...form.register('lastName')}
                error={form.formState.errors.lastName?.message}
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t('phone')}</span>
            <Input
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t('newPasswordOptional')}</span>
            <Input
              type="password"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t('currentPassword')}</span>
            <Input
              type="password"
              {...form.register('currentPassword')}
              error={form.formState.errors.currentPassword?.message}
            />
          </label>
          <Button type="submit" isLoading={updateUser.isPending}>
            {tProfile('save')}
          </Button>
        </form>
      )}
    </div>
  );
}
