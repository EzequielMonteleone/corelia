import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {queryClient} from '@/lib/queryClient';
import {authPersistStorage} from '@/lib/secureStorage';
import type {UserData} from '@/types/user';

interface AuthState {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: UserData, token: string) => void;
  patchUser: (
    patch: Pick<UserData, 'email' | 'firstName' | 'lastName'> & {
      phone?: string;
    },
  ) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      patchUser: patch =>
        set(state => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              email: patch.email,
              firstName: patch.firstName,
              lastName: patch.lastName,
              phone: patch.phone,
            },
          };
        }),
      logout: () => {
        queryClient.clear();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      setHasHydrated: value => set({_hasHydrated: value}),
    }),
    {
      name: 'corelia-auth',
      storage: createJSONStorage(() => authPersistStorage),
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return () => useAuthStore.getState().setHasHydrated(true);
      },
    },
  ),
);
