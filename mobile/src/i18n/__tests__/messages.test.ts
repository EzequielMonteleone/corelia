import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';
import {toAppLocale} from '@/i18n/config';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .flatMap(key => keyPaths((value as Record<string, unknown>)[key], `${prefix}.${key}`));
}

function leafValues(value: unknown): unknown[] {
  if (value === null || typeof value !== 'object') {
    return [value];
  }
  return Object.values(value as Record<string, unknown>).flatMap(leafValues);
}

describe('i18n messages', () => {
  it('keeps the same keys in both languages', () => {
    expect(keyPaths(es)).toEqual(keyPaths(en));
  });

  it('has no empty translations', () => {
    for (const catalog of [en, es]) {
      for (const value of leafValues(catalog)) {
        expect(typeof value).toBe('string');
        expect((value as string).trim()).not.toBe('');
      }
    }
  });
});

describe('toAppLocale', () => {
  it('maps Spanish variants to es', () => {
    expect(toAppLocale('es')).toBe('es');
    expect(toAppLocale('es-419')).toBe('es');
    expect(toAppLocale('ES-ar')).toBe('es');
  });

  it('falls back to English for any other language', () => {
    expect(toAppLocale('en')).toBe('en');
    expect(toAppLocale('pt-BR')).toBe('en');
    expect(toAppLocale(null)).toBe('en');
    expect(toAppLocale(undefined)).toBe('en');
  });
});