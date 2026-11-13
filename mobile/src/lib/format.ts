const DEFAULT_LOCALE = 'es-AR';

export function formatCurrency(value: number, locale = DEFAULT_LOCALE) {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `$${formatted}`;
}

export function formatDate(
  value: string | number | Date,
  locale = DEFAULT_LOCALE,
) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(
  value: string | number | Date,
  locale = DEFAULT_LOCALE,
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatLongDate(
  value: Date,
  locale = DEFAULT_LOCALE,
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

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
