'use client';

import {useAuthStore} from '@/store/authStore';
import {useRouter} from '@/i18n/navigation';
import {useEffect} from 'react';

export default function AuthGuard({children}: {children: React.ReactNode}) {
  const {isAuthenticated, _hasHydrated} = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  if (!_hasHydrated) {
    return null; // O un spinner
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
