'use client';

import {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {buttonVariants} from '@/components/ui/Button';
import {canAccessPath, firstAccessiblePath} from '@/lib/navAccess';
import {useAuthStore} from '@/store/authStore';

export function NavGate({children}: {children: ReactNode}) {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const t = useTranslations('Access');

  if (canAccessPath(user, pathname)) return children;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
      <h1 className="text-3xl font-bold">{t('noAccessTitle')}</h1>
      <p className="mt-3 max-w-md text-gray-400">{t('noAccessBody')}</p>
      <Link
        href={firstAccessiblePath(user)}
        className={`${buttonVariants()} mt-8`}>
        {t('goHome')}
      </Link>
    </div>
  );
}
