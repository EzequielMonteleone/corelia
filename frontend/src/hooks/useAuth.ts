import {useMutation} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';
import api from '@/services/api';
import {useAuthStore} from '@/store/authStore';
import type {LoginFormValues} from '@/schemas/auth';
import {isAxiosError} from 'axios';

export function useLoginMutation() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: data => {
      const {user, token} = data;
      setAuth(user, token);
      router.push('/dashboard');
    },
  });
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.error || 'Error al iniciar sesión';
  }
  return 'Ocurrió un error inesperado';
}
