import {apiClient} from '@/api/client';
import type {AmenityReservation, AmenitySlot} from '@/types/amenity';

export interface ReservationsResponse {
  reservations: AmenityReservation[];
  slots: AmenitySlot[];
}

export async function listReservations(input: {
  buildingId: string;
  from: string;
  to: string;
  amenityId?: string;
}): Promise<ReservationsResponse> {
  const {data} = await apiClient.get<ReservationsResponse>(
    `/buildings/${input.buildingId}/reservations`,
    {
      params: {
        from: input.from,
        to: input.to,
        ...(input.amenityId ? {amenityId: input.amenityId} : {}),
      },
    },
  );
  return data;
}

export async function createReservation(input: {
  buildingId: string;
  buildingAmenityId: string;
  unitId: string;
  startsAt: string;
  notes?: string;
}): Promise<AmenityReservation> {
  const {buildingId, ...body} = input;
  const {data} = await apiClient.post<AmenityReservation>(
    `/buildings/${buildingId}/reservations`,
    body,
  );
  return data;
}

export async function cancelReservation(
  id: string,
): Promise<AmenityReservation> {
  const {data} = await apiClient.post<AmenityReservation>(
    `/reservations/${id}/cancel`,
  );
  return data;
}
