import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {colors, radius, spacing, typography} from '@/theme';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  testID?: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  error,
  testID,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected?.label ?? placeholder}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({pressed}) => [
          styles.field,
          pressed && !disabled && styles.pressed,
          error ? styles.fieldError : null,
          disabled && styles.disabled,
        ]}>
        <Text
          numberOfLines={1}
          style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? colors.textMuted : colors.textSecondary}
        />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ModalSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? 'Seleccionar'}
        testID={testID}>
        <View style={styles.options}>
          {options.map(option => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{
                  selected: active,
                  disabled: option.disabled,
                }}
                disabled={option.disabled}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({pressed}) => [
                  styles.option,
                  active && styles.optionActive,
                  pressed && styles.optionPressed,
                  option.disabled && styles.disabled,
                ]}>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      active && styles.optionLabelActive,
                    ]}>
                    {option.label}
                  </Text>
                  {option.description ? (
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  ) : null}
                </View>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>
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
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  pressed: {opacity: 0.8},
  fieldError: {borderColor: 'rgba(248,113,113,0.7)'},
  disabled: {opacity: 0.5},
  value: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '500',
  },
  placeholder: {color: colors.textMuted, fontWeight: '400'},
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  options: {gap: spacing.xs},
  option: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  optionPressed: {opacity: 0.8},
  optionText: {flex: 1},
  optionLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '500',
  },
  optionLabelActive: {color: colors.primary, fontWeight: '700'},
  optionDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
});
