import {colors, radius, spacing, typography} from '@/theme';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type BadgeIntent =
  | 'success'
  | 'danger'
  | 'warning'
  | 'primary'
  | 'purple'
  | 'default';

export function Badge({
  label,
  intent = 'default',
  style,
}: {
  label: string;
  intent?: BadgeIntent;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.badge, intentStyles[intent], style]}>
      <Text style={[styles.label, intentLabelStyles[intent]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

const intentStyles = StyleSheet.create({
  success: {backgroundColor: colors.successSoft},
  danger: {backgroundColor: colors.dangerSoft},
  warning: {backgroundColor: colors.warningSoft},
  primary: {backgroundColor: colors.primarySoft},
  purple: {backgroundColor: colors.purpleSoft},
  default: {backgroundColor: 'rgba(255,255,255,0.08)'},
});

const intentLabelStyles = StyleSheet.create({
  success: {color: colors.success},
  danger: {color: colors.danger},
  warning: {color: colors.warning},
  primary: {color: colors.primary},
  purple: {color: colors.purple},
  default: {color: colors.textSecondary},
});
