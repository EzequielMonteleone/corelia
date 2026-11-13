import {apiClient} from '@/api/client';
import type {Building} from '@/types/building';
import type {
  Amenity,
  BuildingAmenitiesResponse,
  BuildingAmenity,
} from '@/types/amenity';
import type {Unit} from '@/types/unit';
import type {BuildingFormValues} from '@/schemas/building';

export async function listBuildings(): Promise<Building[]> {
  const {data} = await apiClient.get<Building[]>('/buildings');
  return data;
}

export async function getBuilding(id: string): Promise<Building> {
  const {data} = await apiClient.get<Building>(`/buildings/${id}`);
  return data;
}

export async function createBuilding(
  values: BuildingFormValues,
): Promise<Building> {
  const {data} = await apiClient.post<Building>('/buildings', values);
  return data;
}

export async function updateBuilding(
  id: string,
  values: Partial<BuildingFormValues>,
): Promise<Building> {
  const {data} = await apiClient.put<Building>(`/buildings/${id}`, values);
  return data;
}

export async function deleteBuilding(id: string): Promise<void> {
  await apiClient.delete(`/buildings/${id}`);
}

export async function listBuildingUnits(buildingId: string): Promise<Unit[]> {
  const {data} = await apiClient.get<Unit[]>(`/buildings/${buildingId}/units`);
  return data;
}

export async function createUnit(input: {
  buildingId: string;
  name: string;
  floor?: string;
  coefficient?: number;
}): Promise<Unit> {
  const {buildingId, ...body} = input;
  const {data} = await apiClient.post<Unit>(
    `/buildings/${buildingId}/units`,
    body,
  );
  return data;
}

export async function updateUnit(input: {
  id: string;
  name?: string;
  floor?: string | null;
  coefficient?: number | null;
}): Promise<Unit> {
  const {id, ...body} = input;
  const {data} = await apiClient.put<Unit>(`/units/${id}`, body);
  return data;
}

export async function deleteUnit(input: {
  id: string;
  buildingId: string;
}): Promise<string> {
  await apiClient.delete(`/units/${input.id}`);
  return input.buildingId;
}

export async function getBuildingAmenities(
  buildingId: string,
): Promise<BuildingAmenitiesResponse> {
  const {data} = await apiClient.get<BuildingAmenitiesResponse>(
    `/buildings/${buildingId}/amenities`,
  );
  return data;
}

export async function getAmenityCatalog(): Promise<Amenity[]> {
  const {data} = await apiClient.get<Amenity[]>('/amenities/catalog');
  return data;
}

export async function createBuildingAmenity(input: {
  buildingId: string;
  amenityId?: string;
  customAmenityName?: string;
}): Promise<BuildingAmenity> {
  const {buildingId, ...body} = input;
  const {data} = await apiClient.post<BuildingAmenity>(
    `/buildings/${buildingId}/amenities`,
    body,
  );
  return data;
}

export async function updateBuildingAmenity(input: {
  id: string;
  buildingId: string;
  isEnabled?: boolean;
  customName?: string;
  slotMinutes?: number;
  maxConcurrent?: number;
  openTime?: string;
  closeTime?: string;
  rules?: string | null;
}): Promise<BuildingAmenity> {
  const {id, buildingId: _buildingId, ...body} = input;
  const {data} = await apiClient.put<BuildingAmenity>(
    `/amenities/${id}`,
    body,
  );
  return data;
}

export async function deleteBuildingAmenity(input: {
  id: string;
  buildingId: string;
}): Promise<string> {
  await apiClient.delete(`/amenities/${input.id}`);
  return input.buildingId;
}
