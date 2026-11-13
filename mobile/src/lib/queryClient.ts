import {focusManager, QueryClient} from '@tanstack/react-query';
import {AppState} from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

let focusManagerStarted = false;

/** React Query only knows about browser focus. Bridge it to AppState once. */
export function startAppStateFocusManager() {
  if (focusManagerStarted) return () => {};
  focusManagerStarted = true;

  const subscription = AppState.addEventListener('change', status => {
    focusManager.setFocused(status === 'active');
  });

  return () => {
    subscription.remove();
    focusManagerStarted = false;
  };
}
