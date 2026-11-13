import {queryKeys} from '@/api/queryKeys';
import {
  createBuildingUser,
  createGlobalUser,
  deleteUser,
  getProfile,
  getUser,
  getUserAuditLogs,
  listUsers,
  updateUser,
} from '@/api/users.api';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: listUsers,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => getUser(id as string),
    enabled: !!id,
  });
}

export function useUserAuditLogs(id: string | null) {
  return useQuery({
    queryKey: queryKeys.userAudit(id),
    queryFn: () => getUserAuditLogs(id as string),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (user, input) => {
      queryClient.invalidateQueries({queryKey: queryKeys.users});
      queryClient.invalidateQueries({queryKey: queryKeys.user(input.id)});
      queryClient.invalidateQueries({queryKey: queryKeys.userAudit(input.id)});
      queryClient.invalidateQueries({queryKey: queryKeys.profile});
    },
  });
}

export function useCreateGlobalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGlobalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.users});
    },
  });
}

export function useCreateBuildingUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBuildingUser,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.users});
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({queryKey: queryKeys.user(id)});
      queryClient.invalidateQueries({queryKey: queryKeys.users});
    },
  });
}
