import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
} from '@/api/roles.api';
import {queryKeys} from '@/api/queryKeys';

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: listRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions,
    queryFn: listPermissions,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.roles});
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.roles});
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.roles});
    },
  });
}
