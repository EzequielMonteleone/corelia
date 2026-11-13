import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import type {StateStorage} from 'zustand/middleware';

const TOKEN_KEY = 'corelia.auth.token';

const tokenStorage = {
  async get() {
    if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string) {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear() {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

/**
 * Persists profile data in AsyncStorage and the JWT in SecureStore.
 * This keeps the sensitive value encrypted and avoids iOS keychain size limits.
 */
export const authPersistStorage: StateStorage = {
  async getItem(name) {
    const [raw, token] = await Promise.all([
      AsyncStorage.getItem(name),
      tokenStorage.get(),
    ]);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      parsed.state = {...parsed.state, token: token ?? null};
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  },
  async setItem(name, value) {
    try {
      const parsed = JSON.parse(value);
      const token: string | null = parsed.state?.token ?? null;
      if (token) await tokenStorage.set(token);
      else await tokenStorage.clear();

      const state = {...parsed.state};
      delete state.token;
      await AsyncStorage.setItem(name, JSON.stringify({...parsed, state}));
    } catch {
      // A corrupt persist payload should not crash the app.
    }
  },
  async removeItem(name) {
    await Promise.all([AsyncStorage.removeItem(name), tokenStorage.clear()]);
  },
};
