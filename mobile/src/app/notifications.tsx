import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/queries/useNotifications';
import {formatDateTime} from '@/lib/format';
import {notificationPhrase} from '@/lib/notificationText';
import {notificationTarget} from '@/lib/notificationLink';
import {useAppStore} from '@/store/appStore';
import type {NotificationItem} from '@/types/notification';
import {colors, radius, spacing, typography} from '@/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const setSelectedBuildingId = useAppStore(
    state => state.setSelectedBuildingId,
  );

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unread = notifications.filter(item => !item.readAt);
  const read = notifications.filter(item => item.readAt);

  const open = (item: (typeof notifications)[number]) => {
    if (!item.readAt) markRead.mutate(item.id);
    setSelectedBuildingId(item.buildingId);
    router.push(notificationTarget(item));
  };

  return (
    <RequireAccess path="/notifications">
      <Screen
        refreshing={notificationsQuery.isRefetching}
        onRefresh={() => notificationsQuery.refetch()}>
        <AppHeader
          title="Avisos"
          subtitle={
            unread.length > 0
              ? `${unread.length} sin leer`
              : 'Estás al día con las novedades.'
          }
          showBell={false}
          onBack={() => router.back()}
        />

        {notificationsQuery.isLoading ? (
          <LoadingState message="Cargando avisos..." />
        ) : notificationsQuery.isError ? (
          <ErrorState
            message="No pudimos cargar los avisos."
            onRetry={() => notificationsQuery.refetch()}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Sin avisos"
            description="Cuando se publique un documento o cambie un reclamo, te avisamos acá."
          />
        ) : (
          <View style={styles.content}>
            {unread.length > 0 ? (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>Sin leer</Text>
                <View style={styles.list}>
                  {unread.map(item => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      unread
                      onPress={() => open(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {read.length > 0 ? (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>Anteriores</Text>
                <View style={styles.list}>
                  {read.map(item => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onPress={() => open(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </Screen>
    </RequireAccess>
  );
}

function NotificationRow({
  item,
  unread = false,
  onPress,
}: {
  item: NotificationItem;
  unread?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.row,
        unread && styles.rowUnread,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.icon, unread && styles.iconUnread]}>
        <Ionicons
          name={
            item.kind === 'CLAIM_UPDATED'
              ? 'chatbox-ellipses-outline'
              : 'document-text-outline'
          }
          size={19}
          color={unread ? colors.primary : colors.textSecondary}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={3}>
          {notificationPhrase(item)}
        </Text>
        <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
      </View>
      {unread ? <View style={styles.dot} /> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xl},
  group: {gap: spacing.sm},
  groupTitle: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  list: {gap: spacing.sm},
  row: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowUnread: {
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderColor: 'rgba(59,130,246,0.28)',
  },
  pressed: {opacity: 0.8},
  icon: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconUnread: {backgroundColor: colors.primarySoft},
  text: {flex: 1, gap: 3},
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
    lineHeight: 19,
  },
  meta: {color: colors.textMuted, fontSize: typography.caption},
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
