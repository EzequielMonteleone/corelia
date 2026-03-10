'use client';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {loginSchema, type LoginFormValues} from '@/schemas/auth';
import {useLoginMutation, getErrorMessage} from '@/hooks/useAuth';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {useCallback} from 'react';
import {useTranslations} from 'next-intl';

export default function LoginForm() {
  const loginMutation = useLoginMutation();
  const t = useTranslations('Login');

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = useCallback(
    (data: LoginFormValues) => {
      loginMutation.mutate(data);
    },
    [loginMutation],
  );

  const tAuth = useTranslations('Auth');
  const error = loginMutation.error
    ? getErrorMessage(loginMutation.error, key => tAuth(key))
    : null;
  const loading = loginMutation.isPending;

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          {t('welcome')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          {t('subtitle')}
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {t('email')}
            </label>
            <Input
              {...register('email')}
              placeholder={t('emailPlaceholder')}
              error={errors.email?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {t('password')}
            </label>
            <Input
              type="password"
              {...register('password')}
              placeholder={t('passwordPlaceholder')}
              error={errors.password?.message}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            fullWidth
            size="lg"
            className="text-base"
            disabled={loading}>
            {loading ? t('loading') : t('submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
