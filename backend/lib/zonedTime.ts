/** Wall-clock used for amenity hours. Bookings are interpreted in this zone. */
export const APP_TIMEZONE =
  process.env.APP_TIMEZONE?.trim() || 'America/Argentina/Buenos_Aires';

const HM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseHm(value: string): number | null {
  const match = HM_RE.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatHm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  return {
    minutes: hour * 60 + Number(parts.minute),
    day: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function zonedClock(date: Date, timeZone = APP_TIMEZONE) {
  return zonedParts(date, timeZone);
}

function finiteAt(values: number[], index: number): number | null {
  const value = values[index];
  return value === undefined || !Number.isFinite(value) ? null : value;
}

/** Instant whose wall clock in `timeZone` is `date` (YYYY-MM-DD) at `hm` (HH:mm). */
export function zonedDateTime(
  date: string,
  hm: string,
  timeZone = APP_TIMEZONE,
): Date {
  const dateParts = date.split('-').map(Number);
  const timeParts = hm.split(':').map(Number);
  const year = finiteAt(dateParts, 0);
  const month = finiteAt(dateParts, 1);
  const day = finiteAt(dateParts, 2);
  const hour = finiteAt(timeParts, 0);
  const minute = finiteAt(timeParts, 1);
  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null
  ) {
    return new Date(NaN);
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = zonedParts(utcGuess, timeZone);
  const zonedDate = parts.day.split('-').map(Number);
  const zYear = finiteAt(zonedDate, 0);
  const zMonth = finiteAt(zonedDate, 1);
  const zDay = finiteAt(zonedDate, 2);
  if (zYear === null || zMonth === null || zDay === null) {
    return new Date(NaN);
  }

  const zonedAsUtc = Date.UTC(
    zYear,
    zMonth - 1,
    zDay,
    Math.floor(parts.minutes / 60),
    parts.minutes % 60,
  );
  return new Date(utcGuess.getTime() - (zonedAsUtc - utcGuess.getTime()));
}
