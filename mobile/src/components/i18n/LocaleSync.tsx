import {useEffect} from 'react';
import {useLocales} from 'expo-localization';
import {changeLocale} from '@/i18n';

/**
 * Keeps the app language in sync with the OS locale.
 * On Android the locales update in place; on iOS a restart may be required.
 */
export function LocaleSync() {
  const locales = useLocales();
  const languageCode = locales[0]?.languageCode;

  useEffect(() => {
    changeLocale(languageCode);
  }, [languageCode]);

  return null;
}