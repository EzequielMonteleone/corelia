import {apiClient} from '@/api/client';
import type {UserAuditLog, UserData} from '@/types/user';
import type {UserCreateFormValues} from '@/schemas/user';

export interface UpdateUserInput extends Partial<UserData> {
  id: string;
  passwordPlain?: string;
  currentPassword?: string;
  buildingId?: string;
  roleName?: string;
  unitIds?: string[];
}

export async function getProfile(): Promise<UserData> {
  const {data} = await apiClient.get<UserData>('/users/me');
  return data;
}

export async function listUsers(): Promise<UserData[]> {
  const {data} = await apiClient.get<UserData[]>('/users');
  return data;
}

export async function getUser(id: string): Promise<UserData> {
  const {data} = await apiClient.get<UserData>(`/users/${id}`);
  return data;
}

export async function getUserAuditLogs(id: string): Promise<UserAuditLog[]> {
  const {data} = await apiClient.get<UserAuditLog[]>(`/users/${id}/audit-logs`);
  return data;
}

export async function updateUser(input: UpdateUserInput): Promise<UserData> {
  const {id, ...body} = input;
  const {data} = await apiClient.put<UserData>(`/users/${id}`, body);
  return data;
}

export async function createGlobalUser(
  values: UserCreateFormValues,
): Promise<UserData> {
  const {data} = await apiClient.post<UserData>('/users', {
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    password: values.password,
    globalRole: 'SUPERADMIN',
  });
  return data;
}

export async function createBuildingUser(
  values: UserCreateFormValues,
): Promise<{user: {id: string}}> {
  if (!values.buildingId || !values.roleName) {
    throw new Error('BUILDING_AND_ROLE_REQUIRED');
  }
  const {data} = await apiClient.post<{user: {id: string}}>(
    `/users/building/${values.buildingId}`,
    {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      password: values.password,
      roleName: values.roleName,
      unitIds: values.unitIds ?? [],
    },
  );
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
