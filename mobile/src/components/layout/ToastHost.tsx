import {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useToastStore, type ToastItem} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';

export function ToastHost() {
  const toasts = useToastStore(state => state.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.host, {bottom: Math.max(insets.bottom, 12) + 72}]}>
      {toasts.map(item => (
        <Toast key={item.id} item={item} />
      ))}
    </View>
  );
}

function Toast({item}: {item: ToastItem}) {
  const dismiss = useToastStore(state => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 3200);
    return () => clearTimeout(timer);
  }, [dismiss, item.id]);

  const tone =
    item.type === 'success'
      ? {icon: 'checkmark-circle' as const, color: colors.success}
      : item.type === 'error'
        ? {icon: 'alert-circle' as const, color: colors.danger}
        : {icon: 'information-circle' as const, color: colors.primary};

  return (
    <View style={styles.toast}>
      <Ionicons name={tone.icon} size={20} color={tone.color} />
      <Text style={styles.message} numberOfLines={3}>
        {item.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: spacing.sm,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
    zIndex: 999,
  },
  toast: {
    alignItems: 'center',
    backgroundColor: '#1b1e25',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  message: {
    color: colors.text,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '500',
    lineHeight: 18,
  },
});
