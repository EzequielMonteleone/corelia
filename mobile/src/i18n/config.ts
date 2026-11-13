export const locales = ['en', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** BCP 47 tags used by Intl for dates, numbers and currency. */
export const localeTags: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-AR',
};

/** Maps any OS language tag (e.g. `es-419`, `en-GB`) to a supported locale. */
export function toAppLocale(language: string | null | undefined): Locale {
  return language?.toLowerCase().startsWith('es') ? 'es' : defaultLocale;
}
