import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {useNotifications} from '@/hooks/queries/useNotifications';
import {colors, typography} from '@/theme';

export function NotificationBell({onPress}: {onPress: () => void}) {
  const {t} = useTranslation();
  const {data} = useNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0
          ? t('Notifications.bellUnread', {unread})
          : t('Notifications.bell')
      }
      onPress={onPress}
      style={styles.button}>
      <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -3,
    top: -3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
});

export const notificationBellStyles = typography;
