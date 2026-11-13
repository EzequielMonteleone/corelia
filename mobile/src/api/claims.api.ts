import {apiClient} from '@/api/client';
import type {
  Claim,
  ClaimCreateInput,
  ClaimList,
  ClaimUpdateInput,
} from '@/types/claims';

export async function listClaims(input: {
  buildingId: string;
  unitId?: string | null;
  buildingAmenityId?: string | null;
}): Promise<ClaimList> {
  const {data} = await apiClient.get<ClaimList>(
    `/buildings/${input.buildingId}/claims`,
    {
      params: {
        ...(input.unitId ? {unitId: input.unitId} : {}),
        ...(input.buildingAmenityId
          ? {buildingAmenityId: input.buildingAmenityId}
          : {}),
      },
    },
  );
  return data;
}

export async function createClaim(input: {
  buildingId: string;
  unitId?: string;
  buildingAmenityId?: string;
} & ClaimCreateInput): Promise<Claim> {
  const {buildingId, ...body} = input;
  const {data} = await apiClient.post<Claim>(
    `/buildings/${buildingId}/claims`,
    body,
  );
  return data;
}

export async function updateClaim(
  input: {id: string} & ClaimUpdateInput,
): Promise<Claim> {
  const {id, ...body} = input;
  const {data} = await apiClient.patch<Claim>(`/claims/${id}`, body);
  return data;
}
