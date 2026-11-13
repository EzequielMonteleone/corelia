import {haptics} from '@/lib/haptics';
import {colors, radius, spacing, typography} from '@/theme';
import type {ReactNode} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  title?: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  title,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{disabled: isDisabled, busy: loading}}
      testID={testID}
      disabled={isDisabled}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={({pressed}) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.text}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          {title ? (
            <Text
              style={[
                styles.label,
                labelSizeStyles[size],
                labelVariantStyles[variant],
                icon ? styles.labelWithIcon : null,
              ]}
              numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
  },
  fullWidth: {width: '100%'},
  pressed: {opacity: 0.78, transform: [{scale: 0.99}]},
  disabled: {opacity: 0.45},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {fontWeight: '600'},
  labelWithIcon: {marginLeft: spacing.sm},
});

const sizeStyles = StyleSheet.create({
  sm: {height: 36, paddingHorizontal: spacing.md},
  md: {height: 44, paddingHorizontal: spacing.lg},
  lg: {height: 52, paddingHorizontal: spacing.xl},
  icon: {height: 40, width: 40, paddingHorizontal: 0},
});

const labelSizeStyles = StyleSheet.create({
  sm: {fontSize: typography.small},
  md: {fontSize: typography.body},
  lg: {fontSize: typography.h3},
  icon: {fontSize: typography.small},
});

const variantStyles = StyleSheet.create({
  primary: {backgroundColor: colors.primary},
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {backgroundColor: 'transparent'},
  destructive: {backgroundColor: colors.dangerSoft},
});

const labelVariantStyles = StyleSheet.create({
  primary: {color: colors.white},
  secondary: {color: colors.text},
  outline: {color: colors.text},
  ghost: {color: colors.textSecondary},
  destructive: {color: colors.danger},
});
