import {useMutation} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {loginRequest} from '@/api/auth.api';
import {useAuthStore} from '@/store/authStore';

export function useLoginMutation() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: ({user, token}) => {
      setAuth(user, token);
      router.replace('/');
    },
  });
}
