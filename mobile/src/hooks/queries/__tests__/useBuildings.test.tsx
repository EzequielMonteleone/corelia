import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {renderHook, waitFor} from '@testing-library/react-native';
import {listBuildings} from '@/api/buildings.api';
import {queryKeys} from '@/api/queryKeys';
import {useBuildings} from '@/hooks/queries/useBuildings';
import type {Building} from '@/types/building';

jest.mock('@/api/buildings.api', () => ({
  listBuildings: jest.fn(),
}));

const building: Building = {
  id: 'building-1',
  name: 'Edificio Central',
  address: 'Av. Siempre Viva 123',
  city: 'Buenos Aires',
  country: 'Argentina',
  active: true,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: {queries: {retry: false, gcTime: 0}},
  });
  const wrapper = ({children}: {children: ReactNode}) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {client, wrapper};
}

describe('useBuildings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and caches the building list', async () => {
    jest.mocked(listBuildings).mockResolvedValue([building]);
    const {client, wrapper} = setup();

    const {result} = await renderHook(() => useBuildings(), {wrapper});

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([building]);
    expect(listBuildings).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(queryKeys.buildings)).toEqual([building]);
  });

  it('exposes the error state when the request fails', async () => {
    jest.mocked(listBuildings).mockRejectedValue(new Error('network down'));
    const {wrapper} = setup();

    const {result} = await renderHook(() => useBuildings(), {wrapper});

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
