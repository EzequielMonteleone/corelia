import {queryClient} from '@/lib/queryClient';
import {useAuthStore} from '@/store/authStore';
import type {UserData} from '@/types/user';

jest.mock('@/lib/secureStorage', () => ({
  authPersistStorage: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

const user = {
  id: 'user-1',
  email: 'ana@corelia.com',
  firstName: 'Ana',
  lastName: 'Pérez',
  phone: '1122334455',
  globalRole: 'USER',
  isActive: true,
  buildingUsers: [],
} as unknown as UserData;

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
    });
    jest.restoreAllMocks();
  });

  it('stores the session on login', () => {
    useAuthStore.getState().setAuth(user, 'jwt-token');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe('jwt-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('patches editable profile fields without losing the rest', () => {
    useAuthStore.getState().setAuth(user, 'jwt-token');
    useAuthStore.getState().patchUser({
      email: 'nueva@corelia.com',
      firstName: 'Ana María',
      lastName: 'Pérez',
      phone: undefined,
    });

    const updated = useAuthStore.getState().user;
    expect(updated).toMatchObject({
      id: 'user-1',
      email: 'nueva@corelia.com',
      firstName: 'Ana María',
      globalRole: 'USER',
    });
    expect(updated?.phone).toBeUndefined();
  });

  it('clears the session and query cache on logout', () => {
    const clear = jest.spyOn(queryClient, 'clear');
    useAuthStore.getState().setAuth(user, 'jwt-token');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('marks hydration as finished', () => {
    useAuthStore.getState().setHasHydrated(true);
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
  });
});
