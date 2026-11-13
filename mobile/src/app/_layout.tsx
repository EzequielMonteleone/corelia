import {LocaleSync} from '@/components/i18n/LocaleSync';
import {BootScreen} from '@/components/layout/BootScreen';
import {ToastHost} from '@/components/layout/ToastHost';
import i18n from '@/i18n';
import {queryClient, startAppStateFocusManager} from '@/lib/queryClient';
import {useAuthStore} from '@/store/authStore';
import {colors} from '@/theme';
import {QueryClientProvider} from '@tanstack/react-query';
import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {I18nextProvider} from 'react-i18next';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

if (__DEV__) {
  // Initializes Reactotron before the app renders.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/lib/reactotron');
}

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash control is best-effort (e.g. web).
});

function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hydrated = useAuthStore(state => state._hasHydrated);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return <BootScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="buildings/[id]" />
        <Stack.Screen name="expenses/[periodId]" />
        <Stack.Screen name="amenities" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="claims" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="household" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="roles" />
        <Stack.Screen name="users/index" />
        <Stack.Screen name="users/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => startAppStateFocusManager(), []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <LocaleSync />
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" />
            <RootNavigator />
            <ToastHost />
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
