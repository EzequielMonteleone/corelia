import {UserData} from '@/types/user';
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {immer} from 'zustand/middleware/immer';
import {queryClient} from '@/lib/queryClient';

interface AuthState {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: UserData, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  immer(
    persist(
      set => ({
        user: null,
        token: null,
        isAuthenticated: false,
        _hasHydrated: false,
        setAuth: (user, token) =>
          set(state => {
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
          }),
        logout: () => {
          queryClient.clear();
          set(state => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
          });
        },
        setHasHydrated: state =>
          set(s => {
            s._hasHydrated = state;
          }),
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        onRehydrateStorage: state => {
          return () => state.setHasHydrated(true);
        },
      },
    ),
  ),
);
