import {isAxiosError} from 'axios';

export function errorCode(error: unknown) {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (typeof code === 'string') return code;
  }
  return 'UNKNOWN';
}
