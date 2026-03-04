'use client';

import {useAuthStore} from '@/store/authStore';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

export default function AuthGuard({children}: {children: React.ReactNode}) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner if preferred
  }

  return <>{children}</>;
}
