import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {RoleFormValues} from '@/schemas/role';
import {Permission, Role} from '@/types/role';

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data;
    },
  });
}

export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/permissions');
      return res.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newRole: RoleFormValues) => {
      const res = await apiClient.post('/roles', newRole);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['roles']});
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, ...data}: RoleFormValues & {id: string}) => {
      const res = await apiClient.put(`/roles/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['roles']});
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['roles']});
    },
  });
}
