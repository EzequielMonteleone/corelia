import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {Building} from '@/types/building';

export function useBuildings() {
  return useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: async () => {
      const res = await apiClient.get('/buildings');
      return res.data;
    },
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newBuilding: Partial<Building>) => {
      const res = await apiClient.post('/buildings', newBuilding);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['buildings']});
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/buildings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['buildings']});
    },
  });
}
