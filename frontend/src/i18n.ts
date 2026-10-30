import {locale as localeParam} from 'next/root-params';
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {defaultLocale, locales, type Locale} from './i18n/config';

function knownLocale(value: string | undefined): value is Locale {
  return locales.some(locale => locale === value);
}

export default getRequestConfig(async ({locale}) => {
  const requested = locale || (await localeParam()) || defaultLocale;
  if (!knownLocale(requested)) notFound();

  return {
    locale: requested,
    messages: (await import(`../messages/${requested}.json`)).default,
  };
});
