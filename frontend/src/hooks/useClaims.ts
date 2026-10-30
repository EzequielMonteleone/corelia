import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {Claim, ClaimCreateInput, ClaimList, ClaimUpdateInput} from '@/types/claims';

export function useClaims(
  buildingId: string | null,
  filter: {unitId: string | null; buildingAmenityId: string | null},
) {
  return useQuery<ClaimList>({
    queryKey: ['claims', buildingId, filter.unitId, filter.buildingAmenityId],
    queryFn: async () => {
      const res = await apiClient.get(`/buildings/${buildingId}/claims`, {
        params: {
          ...(filter.unitId ? {unitId: filter.unitId} : {}),
          ...(filter.buildingAmenityId
            ? {buildingAmenityId: filter.buildingAmenityId}
            : {}),
        },
      });
      return res.data;
    },
    enabled: !!buildingId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: {buildingId: string; unitId?: string; buildingAmenityId?: string} &
        ClaimCreateInput,
    ) => {
      const {buildingId, ...body} = input;
      const res = await apiClient.post(`/buildings/${buildingId}/claims`, body);
      return res.data as Claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['claims']});
    },
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string} & ClaimUpdateInput) => {
      const {id, ...body} = input;
      const res = await apiClient.patch(`/claims/${id}`, body);
      return res.data as Claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['claims']});
    },
  });
}
