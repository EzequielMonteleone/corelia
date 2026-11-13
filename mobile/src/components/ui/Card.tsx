import {Pressable, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {colors, radius, spacing} from '@/theme';

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({pressed}) => [
          styles.card,
          pressed && styles.pressed,
          style,
        ]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  pressed: {
    borderColor: 'rgba(59,130,246,0.45)',
    opacity: 0.92,
  },
});
