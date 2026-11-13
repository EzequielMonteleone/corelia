import {formatCurrency, formatLongDate, initials} from '@/lib/format';

describe('format', () => {
  it('formats currency with two decimals', () => {
    expect(formatCurrency(1234.5, 'en-US')).toBe('$1,234.50');
    expect(formatCurrency(0, 'en-US')).toBe('$0.00');
  });

  it('builds initials and falls back to a placeholder', () => {
    expect(initials('ana', 'perez')).toBe('AP');
    expect(initials('ana')).toBe('A');
    expect(initials()).toBe('?');
  });

  

  it('formats a long date in the requested timezone', () => {
    const value = new Date('2026-11-12T15:00:00.000Z');
    expect(formatLongDate(value, 'es-AR', 'UTC')).toContain('12');
    expect(formatLongDate(value, 'es-AR', 'UTC')).toContain('noviembre');
  });
});
