import {apiClient} from '@/api/client';
import type {
  Household,
  HouseholdMember,
  HouseholdMemberInput,
  Pet,
  PetInput,
  Vehicle,
  VehicleInput,
} from '@/types/household';

export async function getHousehold(unitId: string): Promise<Household> {
  const {data} = await apiClient.get<Household>(`/units/${unitId}/household`);
  return data;
}

export async function createMember(
  input: {unitId: string} & HouseholdMemberInput,
): Promise<HouseholdMember> {
  const {unitId, ...body} = input;
  const {data} = await apiClient.post<HouseholdMember>(
    `/units/${unitId}/members`,
    body,
  );
  return data;
}

export async function updateMember(
  input: {id: string} & HouseholdMemberInput,
): Promise<HouseholdMember> {
  const {id, ...body} = input;
  const {data} = await apiClient.put<HouseholdMember>(`/members/${id}`, body);
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  await apiClient.delete(`/members/${id}`);
}

export async function createVehicle(
  input: {unitId: string} & VehicleInput,
): Promise<Vehicle> {
  const {unitId, ...body} = input;
  const {data} = await apiClient.post<Vehicle>(
    `/units/${unitId}/vehicles`,
    body,
  );
  return data;
}

export async function updateVehicle(
  input: {id: string} & VehicleInput,
): Promise<Vehicle> {
  const {id, ...body} = input;
  const {data} = await apiClient.put<Vehicle>(`/vehicles/${id}`, body);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(`/vehicles/${id}`);
}

export async function createPet(
  input: {unitId: string} & PetInput,
): Promise<Pet> {
  const {unitId, ...body} = input;
  const {data} = await apiClient.post<Pet>(`/units/${unitId}/pets`, body);
  return data;
}

export async function updatePet(
  input: {id: string} & PetInput,
): Promise<Pet> {
  const {id, ...body} = input;
  const {data} = await apiClient.put<Pet>(`/pets/${id}`, body);
  return data;
}

export async function deletePet(id: string): Promise<void> {
  await apiClient.delete(`/pets/${id}`);
}
