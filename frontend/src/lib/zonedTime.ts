export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Argentina/Buenos_Aires';

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

export function zonedClock(date: Date, timeZone = APP_TIMEZONE) {
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

export function zonedDateTime(date: string, hm: string, timeZone = APP_TIMEZONE): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = hm.split(':').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = zonedClock(utcGuess, timeZone);
  const [zYear, zMonth, zDay] = parts.day.split('-').map(Number);
  const zonedAsUtc = Date.UTC(
    zYear,
    zMonth - 1,
    zDay,
    Math.floor(parts.minutes / 60),
    parts.minutes % 60,
  );
  return new Date(utcGuess.getTime() - (zonedAsUtc - utcGuess.getTime()));
}

export function todayKey(timeZone = APP_TIMEZONE) {
  return zonedClock(new Date(), timeZone).day;
}

export function shiftDateKey(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function slotsForWindow(openTime: string, closeTime: string, slotMinutes: number) {
  const open = parseHm(openTime);
  const close = parseHm(closeTime);
  if (open === null || close === null || slotMinutes <= 0) return [];
  const slots: string[] = [];
  for (let cursor = open; cursor + slotMinutes <= close; cursor += slotMinutes) {
    slots.push(formatHm(cursor));
  }
  return slots;
}
