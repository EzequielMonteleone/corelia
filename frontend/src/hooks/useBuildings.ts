import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {Building} from '@/types/building';
import {Unit} from '@/types/unit';
import {BuildingAmenitiesResponse} from '@/types/amenity';

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

export function useBuildingUnits(buildingId: string | null) {
  return useQuery<Unit[]>({
    queryKey: ['building-units', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const res = await apiClient.get(`/buildings/${buildingId}/units`);
      return res.data;
    },
    enabled: !!buildingId,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buildingId,
      ...data
    }: {buildingId: string} & Partial<Unit>) => {
      const res = await apiClient.post(`/buildings/${buildingId}/units`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['buildings', variables.buildingId]});
      queryClient.invalidateQueries({queryKey: ['building-units', variables.buildingId]});
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, ...data}: {id: string} & Partial<Unit>) => {
      const res = await apiClient.put(`/units/${id}`, data);
      return res.data as Unit;
    },
    onSuccess: updated => {
      queryClient.invalidateQueries({queryKey: ['building-units', updated.buildingId]});
      queryClient.invalidateQueries({queryKey: ['buildings', updated.buildingId]});
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, buildingId}: {id: string; buildingId: string}) => {
      await apiClient.delete(`/units/${id}`);
      return buildingId;
    },
    onSuccess: buildingId => {
      queryClient.invalidateQueries({queryKey: ['building-units', buildingId]});
      queryClient.invalidateQueries({queryKey: ['buildings', buildingId]});
    },
  });
}

export function useBuildingAmenities(buildingId: string | null) {
  return useQuery<BuildingAmenitiesResponse>({
    queryKey: ['building-amenities', buildingId],
    queryFn: async () => {
      if (!buildingId) {
        return {catalog: [], amenities: []};
      }
      const res = await apiClient.get(`/buildings/${buildingId}/amenities`);
      return res.data;
    },
    enabled: !!buildingId,
  });
}

export function useCreateBuildingAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buildingId,
      amenityId,
      customAmenityName,
    }: {
      buildingId: string;
      amenityId?: string;
      customAmenityName?: string;
    }) => {
      const res = await apiClient.post(`/buildings/${buildingId}/amenities`, {
        amenityId,
        customAmenityName,
      });
      return {buildingId, data: res.data};
    },
    onSuccess: ({buildingId}) => {
      queryClient.invalidateQueries({queryKey: ['building-amenities', buildingId]});
      queryClient.invalidateQueries({queryKey: ['buildings', buildingId]});
    },
  });
}

export function useUpdateBuildingAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      buildingId,
      ...data
    }: {
      id: string;
      buildingId: string;
      isEnabled?: boolean;
      customName?: string;
    }) => {
      const res = await apiClient.put(`/amenities/${id}`, data);
      return {buildingId, data: res.data};
    },
    onSuccess: ({buildingId}) => {
      queryClient.invalidateQueries({queryKey: ['building-amenities', buildingId]});
      queryClient.invalidateQueries({queryKey: ['buildings', buildingId]});
    },
  });
}

export function useDeleteBuildingAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, buildingId}: {id: string; buildingId: string}) => {
      await apiClient.delete(`/amenities/${id}`);
      return buildingId;
    },
    onSuccess: buildingId => {
      queryClient.invalidateQueries({queryKey: ['building-amenities', buildingId]});
      queryClient.invalidateQueries({queryKey: ['buildings', buildingId]});
    },
  });
}
