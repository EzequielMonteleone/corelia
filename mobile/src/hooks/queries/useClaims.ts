import {createClaim, listClaims, updateClaim} from '@/api/claims.api';
import {queryKeys} from '@/api/queryKeys';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export function useClaims(
  buildingId: string | null,
  filter: {unitId: string | null; buildingAmenityId: string | null},
) {
  return useQuery({
    queryKey: queryKeys.claims(
      buildingId,
      filter.unitId,
      filter.buildingAmenityId,
    ),
    queryFn: () =>
      listClaims({
        buildingId: buildingId as string,
        unitId: filter.unitId,
        buildingAmenityId: filter.buildingAmenityId,
      }),
    enabled: !!buildingId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.claimsRoot});
    },
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.claimsRoot});
    },
  });
}
