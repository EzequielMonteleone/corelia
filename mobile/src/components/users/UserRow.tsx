import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {Badge} from '@/components/ui/Badge';
import {initials} from '@/lib/format';
import type {UserData} from '@/types/user';
import {colors, radius, spacing, typography} from '@/theme';

const ROLE_LABEL_KEYS = {
  Admin: 'Users.admin',
  Owner: 'Users.owner',
  Roomer: 'Users.roomer',
} as const;

export function UserRow({
  user,
  onPress,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  user: UserData;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const {t} = useTranslation();
  const role = user.buildingUsers?.[0]?.role?.name;
  const roleLabel =
    role && role in ROLE_LABEL_KEYS
      ? t(ROLE_LABEL_KEYS[role as keyof typeof ROLE_LABEL_KEYS])
      : role;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${user.firstName} ${user.lastName}`}
        onPress={onPress}
        style={({pressed}) => [styles.main, pressed && styles.pressed]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials(user.firstName, user.lastName)}
          </Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
          <View style={styles.badges}>
            {roleLabel ? (
              <Badge label={roleLabel} intent="primary" />
            ) : null}
            {user.globalRole === 'SUPERADMIN' ? (
              <Badge label={t('Common.superadmin')} intent="purple" />
            ) : null}
            <Badge
              label={user.isActive ? t('Common.active') : t('Common.inactive')}
              intent={user.isActive ? 'success' : 'danger'}
            />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <View style={styles.actions}>
        {canEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Users.editUserAccessibility', {
              name: user.firstName,
            })}
            hitSlop={6}
            onPress={onEdit}
            style={styles.action}>
            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Users.deleteUserAccessibility', {
              name: user.firstName,
            })}
            hitSlop={6}
            onPress={onDelete}
            style={styles.action}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  main: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {backgroundColor: 'rgba(255,255,255,0.03)'},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: colors.indigo,
    fontSize: typography.small,
    fontWeight: '800',
  },
  text: {flex: 1, gap: 2},
  name: {color: colors.text, fontSize: typography.body, fontWeight: '700'},
  email: {color: colors.textMuted, fontSize: typography.caption},
  badges: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4},
  actions: {flexDirection: 'row', gap: spacing.xs, paddingRight: spacing.sm},
  action: {padding: spacing.xs},
});
