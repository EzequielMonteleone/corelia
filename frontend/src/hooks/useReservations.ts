import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {AmenityReservation} from '@/types/amenity';

export function useReservations(
  buildingId: string | null,
  range: {from: string; to: string} | null,
  amenityId: string | null,
) {
  return useQuery<AmenityReservation[]>({
    queryKey: ['reservations', buildingId, amenityId, range?.from, range?.to],
    queryFn: async () => {
      if (!buildingId || !range) return [];
      const res = await apiClient.get(`/buildings/${buildingId}/reservations`, {
        params: {
          from: range.from,
          to: range.to,
          ...(amenityId ? {amenityId} : {}),
        },
      });
      return res.data;
    },
    enabled: !!buildingId && !!range,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      buildingId: string;
      buildingAmenityId: string;
      unitId: string;
      startsAt: string;
    }) => {
      const res = await apiClient.post(`/buildings/${input.buildingId}/reservations`, {
        buildingAmenityId: input.buildingAmenityId,
        unitId: input.unitId,
        startsAt: input.startsAt,
      });
      return res.data as AmenityReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['reservations']});
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/reservations/${id}/cancel`);
      return res.data as AmenityReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['reservations']});
    },
  });
}
