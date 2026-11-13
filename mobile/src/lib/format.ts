import {currentLocaleTag} from '@/i18n';

export function formatCurrency(value: number, locale = currentLocaleTag()) {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `$${formatted}`;
}

export function formatDate(
  value: string | number | Date,
  locale = currentLocaleTag(),
) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(
  value: string | number | Date,
  locale = currentLocaleTag(),
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatLongDate(
  value: Date,
  locale = currentLocaleTag(),
  timeZone?: string,
) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(timeZone ? {timeZone} : {}),
  }).format(value);
}

export function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}
