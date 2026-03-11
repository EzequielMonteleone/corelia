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

export function useBuilding(id: string | null) {
  return useQuery<Building | null>({
    queryKey: ['buildings', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/buildings/${id}`);
      return res.data;
    },
    enabled: !!id,
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

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {id: string} & Partial<Building>) => {
      const res = await apiClient.put(`/buildings/${id}`, data);
      return res.data;
    },
    onSuccess: (updated: Building) => {
      queryClient.invalidateQueries({queryKey: ['buildings']});
      queryClient.invalidateQueries({queryKey: ['buildings', updated.id]});
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
