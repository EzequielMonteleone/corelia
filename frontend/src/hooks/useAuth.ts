import {useMutation} from '@tanstack/react-query';
import {useRouter} from '@/i18n/navigation';
import apiClient from '@/lib/apiClient';
import {useAuthStore} from '@/store/authStore';
import type {LoginFormValues} from '@/schemas/auth';
import {isAxiosError} from 'axios';

export function useLoginMutation() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiClient.post('/auth/login', data);
      return response.data;
    },
    onSuccess: data => {
      const {user, token} = data;
      setAuth(user, token);
      router.push('/dashboard');
    },
  });
}

export type AuthTranslateFn = (key: 'loginError' | 'unexpectedError') => string;

export function getErrorMessage(error: unknown, t?: AuthTranslateFn): string {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      (t ? t('loginError') : 'Error al iniciar sesión')
    );
  }
  return t ? t('unexpectedError') : 'Ocurrió un error inesperado';
}
