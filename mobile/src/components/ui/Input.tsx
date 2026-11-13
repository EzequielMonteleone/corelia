import {useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, radius, spacing, typography} from '@/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  style,
  secureTextEntry,
  multiline,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.multilineField,
          focused && styles.focused,
          error ? styles.errored : null,
        ]}>
        <TextInput
          {...props}
          multiline={multiline}
          secureTextEntry={isPassword && !revealed}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            isPassword && styles.passwordInput,
            style,
          ]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            onPress={() => setRevealed(value => !value)}
            style={styles.eye}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {width: '100%'},
  label: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
    marginBottom: spacing.xs + 2,
  },
  field: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
  },
  multilineField: {alignItems: 'stretch', minHeight: 100},
  focused: {borderColor: 'rgba(59,130,246,0.65)'},
  errored: {borderColor: 'rgba(248,113,113,0.7)'},
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  passwordInput: {paddingRight: 44},
  eye: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
});
