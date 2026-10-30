'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {locales, type Locale} from '@/i18n/config';
import {cn} from '@/lib/utils';

export function LocaleSwitcher({className}: {className?: string}) {
  const t = useTranslations('Locale');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function selectLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, {locale: next});
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className={cn(
        'inline-flex rounded-xl border border-white/10 bg-white/5 p-1',
        className,
      )}>
      {locales.map(next => {
        const active = locale === next;
        return (
          <button
            key={next}
            type="button"
            aria-pressed={active}
            onClick={() => selectLocale(next)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}>
            {t(next)}
          </button>
        );
      })}
    </div>
  );
}
