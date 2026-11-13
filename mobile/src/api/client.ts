import {useAuthStore} from '@/store/authStore';
import {create} from 'axios';
import {Platform} from 'react-native';

const ANDROID_EMULATOR_HOST = '10.0.2.2';

function resolveApiUrl(url: string | undefined): string | undefined {
  if (!url || !__DEV__ || Platform.OS !== 'android') return url;

  // Inside the Android emulator, localhost points to the emulator itself.
  // 10.0.2.2 is the host machine alias. Physical devices should use a LAN IP
  // in EXPO_PUBLIC_API_URL instead.
  return url.replace(
    /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i,
    (_match, protocol: string) => `${protocol}${ANDROID_EMULATOR_HOST}`,
  );
}

export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL);

export const apiClient = create({
  baseURL: API_URL,
  timeout: 25_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response?.status === 401 &&
      useAuthStore.getState().isAuthenticated
    ) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
