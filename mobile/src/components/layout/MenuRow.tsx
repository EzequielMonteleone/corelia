import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@/theme';

export function MenuRow({
  icon,
  label,
  description,
  badge,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, danger && styles.iconDanger]}>
        <Ionicons
          name={icon}
          size={19}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {opacity: 0.82},
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconDanger: {backgroundColor: colors.dangerSoft},
  text: {flex: 1, gap: 2},
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  labelDanger: {color: colors.danger},
  description: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 15,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
});
