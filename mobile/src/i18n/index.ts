import {getLocales} from 'expo-localization';
import {createInstance} from 'i18next';
import {initReactI18next} from 'react-i18next';
import {
  defaultLocale,
  localeTags,
  locales,
  toAppLocale,
  type Locale,
} from './config';
import en from './messages/en.json';
import es from './messages/es.json';

export function deviceLocale(): Locale {
  const languageCode = getLocales()[0]?.languageCode;
  return toAppLocale(languageCode);
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    es: {translation: es},
  },
  lng: deviceLocale(),
  fallbackLng: defaultLocale,
  supportedLngs: [...locales],
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

/** Switches the active language, mapping OS tags to a supported locale. */
export function changeLocale(language: string | null | undefined): Locale {
  const locale = toAppLocale(language);
  if (i18n.resolvedLanguage !== locale) {
    void i18n.changeLanguage(locale);
  }
  return locale;
}

export function currentLocale(): Locale {
  return toAppLocale(i18n.resolvedLanguage ?? i18n.language);
}

/** Active BCP 47 tag for Intl formatters. */
export function currentLocaleTag(): string {
  return localeTags[currentLocale()];
}

export default i18n;
