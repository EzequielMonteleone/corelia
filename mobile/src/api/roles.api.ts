import {apiClient} from '@/api/client';
import type {Permission, Role} from '@/types/role';
import type {RoleFormValues} from '@/schemas/role';

export async function listRoles(): Promise<Role[]> {
  const {data} = await apiClient.get<Role[]>('/roles');
  return data;
}

export async function listPermissions(): Promise<Permission[]> {
  const {data} = await apiClient.get<Permission[]>('/roles/permissions');
  return data;
}

export async function createRole(values: RoleFormValues): Promise<Role> {
  const {data} = await apiClient.post<Role>('/roles', values);
  return data;
}

export async function updateRole(
  input: RoleFormValues & {id: string},
): Promise<Role> {
  const {id, ...body} = input;
  const {data} = await apiClient.put<Role>(`/roles/${id}`, body);
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}
