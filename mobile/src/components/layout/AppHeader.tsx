import {NotificationBell} from '@/components/layout/NotificationBell';
import {colors, spacing, typography} from '@/theme';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import type {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';

export function AppHeader({
  title,
  subtitle,
  onBack,
  showBell = true,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBell?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  const {t} = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Common.back')}
            hitSlop={8}
            onPress={onBack}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          {right}
          {showBell ? (
            <NotificationBell onPress={() => router.push('/notifications')} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  tint = colors.textSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={styles.iconButton}>
      <Ionicons name={icon} size={20} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {marginBottom: spacing.lg},
  row: {alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm},
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    marginTop: 2,
    width: 38,
  },
  titleWrap: {flex: 1, gap: 2},
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 19,
  },
  actions: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
});
