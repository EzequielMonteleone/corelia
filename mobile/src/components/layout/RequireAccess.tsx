import {Screen} from '@/components/ui/Screen';
import {EmptyState} from '@/components/ui/States';
import {canAccessPath} from '@/lib/navAccess';
import {useAuthStore} from '@/store/authStore';
import {useRouter} from 'expo-router';
import type {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';

export function RequireAccess({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const {t} = useTranslation();

  if (!canAccessPath(user, path)) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title={t('Access.noAccessTitle')}
          description={t('Access.noAccessBody')}
          actionLabel={t('Access.goHome')}
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  return children;
}
