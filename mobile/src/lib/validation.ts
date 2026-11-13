import type {TFunction} from 'i18next';

/** Resolves a validation key stored by a Zod schema into a localized message. */
export function validationMessage(
  t: TFunction,
  message: string | undefined,
): string | undefined {
  if (!message) return undefined;
  const translate = t as unknown as (key: string) => string;
  return translate(message);
}