import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {UserData} from '@/types/user';
import {UserCreateFormValues} from '@/schemas/user';

export function useUsers() {
  return useQuery<UserData[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });
}

export function useUser(id: string | null) {
  return useQuery<UserData | null>({
    queryKey: ['users', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<UserData> & {
      id: string;
      passwordPlain?: string;
      buildingId?: string;
      roleName?: string;
      unitIds?: string[];
    }) => {
      const res = await apiClient.put(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['users']});
      queryClient.invalidateQueries({queryKey: ['users', variables.id]});
    },
  });
}

export function useCreateGlobalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UserCreateFormValues) => {
      const res = await apiClient.post('/users', {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        globalRole: 'SUPERADMIN',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
    },
  });
}

export function useCreateBuildingUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UserCreateFormValues) => {
      if (!data.buildingId || !data.roleName) {
        throw new Error('BUILDING_AND_ROLE_REQUIRED');
      }
      const res = await apiClient.post(`/users/building/${data.buildingId}`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        roleName: data.roleName,
        unitIds: data.unitIds ?? [],
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({queryKey: ['users']});
      queryClient.invalidateQueries({queryKey: ['users', id]});
    },
  });
}
