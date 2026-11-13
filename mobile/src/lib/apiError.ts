import {isAxiosError} from 'axios';
import i18n from '@/i18n';

export function errorCode(error: unknown): string {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (typeof code === 'string') return code;
    if (error.code) return error.code;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'UNKNOWN';
}

const translate = i18n.t.bind(i18n) as unknown as (
  key: string,
  options?: {defaultValue?: string},
) => string;

export function errorMessage(error: unknown): string {
  const code = errorCode(error);
  return translate(`Errors.${code}`, {
    defaultValue: translate('Errors.UNKNOWN'),
  });
}

export function isNetworkError(error: unknown) {
  return isAxiosError(error) && !error.response;
}

export function axiosStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
