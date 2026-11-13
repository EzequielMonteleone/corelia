import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, radius, spacing, typography} from '@/theme';

export function HouseholdRecordRow({
  icon,
  title,
  subtitle,
  onEdit,
  onDelete,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Editar ${title}`}
        hitSlop={6}
        onPress={onEdit}
        style={styles.action}>
        <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Eliminar ${title}`}
        hitSlop={6}
        onPress={onDelete}
        style={styles.action}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  text: {flex: 1, gap: 2},
  title: {color: colors.text, fontSize: typography.body, fontWeight: '600'},
  subtitle: {color: colors.textMuted, fontSize: typography.caption},
  action: {padding: spacing.xs},
});
