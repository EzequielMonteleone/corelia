import {
  axiosStatus,
  errorCode,
  errorMessage,
  isNetworkError,
} from '@/lib/apiError';

function axiosError(options: {
  code?: string;
  status?: number;
  data?: unknown;
}): unknown {
  return {
    isAxiosError: true,
    code: options.code,
    response:
      options.status === undefined
        ? undefined
        : {status: options.status, data: options.data},
  };
}

describe('apiError', () => {
  it('prefers the API error code', () => {
    expect(
      errorCode(
        axiosError({status: 401, data: {error: 'INVALID_CREDENTIALS'}}),
      ),
    ).toBe('INVALID_CREDENTIALS');
  });

  it('falls back to the axios code and generic error message', () => {
    expect(errorCode(axiosError({code: 'ECONNABORTED'}))).toBe('ECONNABORTED');
    expect(errorCode(new Error('boom'))).toBe('boom');
    expect(errorCode(null)).toBe('UNKNOWN');
  });

  it('maps known codes to user-facing messages', () => {
    expect(errorMessage(axiosError({status: 429, data: {error: 'TOO_MANY_REQUESTS'}}))).toBe(
      'Demasiados intentos. Probá de nuevo en unos minutos.',
    );
    expect(errorMessage(axiosError({status: 400, data: {error: 'NOPE'}}))).toBe(
      'Ocurrió un error inesperado.',
    );
  });

  it('detects network errors and status codes', () => {
    expect(isNetworkError(axiosError({code: 'ERR_NETWORK'}))).toBe(true);
    expect(isNetworkError(axiosError({status: 500, data: {}}))).toBe(false);
    expect(axiosStatus(axiosError({status: 403, data: {}}))).toBe(403);
    expect(axiosStatus(new Error('boom'))).toBeUndefined();
  });
});
