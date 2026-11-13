import {StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Card} from '@/components/ui/Card';
import {colors, radius, spacing, typography} from '@/theme';

export function KpiCard({
  icon,
  label,
  value,
  tint = colors.primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint?: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={[styles.icon, {backgroundColor: `${tint}22`}]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, {color: tint}]} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {flex: 1, gap: spacing.xs, minWidth: 150, padding: spacing.md},
  icon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 32,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 32,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  value: {
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
});
