import {
  formatHm,
  parseHm,
  shiftDateKey,
  slotsForWindow,
  zonedClock,
  zonedDateTime,
} from '@/lib/zonedTime';

const TZ = 'America/Argentina/Buenos_Aires';

describe('zonedTime', () => {
  it('parses and formats hours in HH:mm', () => {
    expect(parseHm('08:30')).toBe(510);
    expect(parseHm('23:59')).toBe(1439);
    expect(parseHm('24:00')).toBeNull();
    expect(parseHm('8:30')).toBeNull();
    expect(formatHm(510)).toBe('08:30');
  });

  it('builds the slots inside a window', () => {
    expect(slotsForWindow('08:00', '10:00', 30)).toEqual([
      '08:00',
      '08:30',
      '09:00',
      '09:30',
    ]);
    expect(slotsForWindow('08:00', '10:00', 0)).toEqual([]);
  });

  it('shifts a date key without crossing timezone issues', () => {
    expect(shiftDateKey('2026-11-12', 1)).toBe('2026-11-13');
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('converts a zoned date and time to a UTC instant', () => {
    expect(zonedDateTime('2026-11-12', '09:00', TZ).toISOString()).toBe(
      '2026-11-12T12:00:00.000Z',
    );
  });

  it('reads the clock in the requested timezone', () => {
    const clock = zonedClock(new Date('2026-11-12T12:00:00.000Z'), TZ);
    expect(clock).toEqual({minutes: 9 * 60, day: '2026-11-12'});
  });
});
