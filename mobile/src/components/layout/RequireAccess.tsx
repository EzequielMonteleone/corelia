import type {ReactNode} from 'react';
import {useRouter} from 'expo-router';
import {EmptyState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useAuthStore} from '@/store/authStore';
import {canAccessPath} from '@/lib/navAccess';

export function RequireAccess({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  if (!canAccessPath(user, path)) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="No tenés acceso"
          description="Esta sección no está disponible para tu usuario."
          actionLabel="Ir al inicio"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  return children;
}
