import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  listNotifications,
  markNotificationRead,
} from '@/api/notifications.api';
import {queryKeys} from '@/api/queryKeys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: listNotifications,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.notificationsRoot});
    },
  });
}
