import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  cancelReservation,
  createReservation,
  listReservations,
} from '@/api/reservations.api';
import {queryKeys} from '@/api/queryKeys';

export function useReservations(
  buildingId: string | null,
  range: {from: string; to: string} | null,
  amenityId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.reservations(
      buildingId,
      amenityId,
      range?.from ?? null,
      range?.to ?? null,
    ),
    queryFn: () =>
      listReservations({
        buildingId: buildingId as string,
        from: range!.from,
        to: range!.to,
        ...(amenityId ? {amenityId} : {}),
      }),
    enabled: !!buildingId && !!range,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.reservationsRoot});
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.reservationsRoot});
    },
  });
}
