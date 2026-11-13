import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Button} from '@/components/ui/Button';
import {colors, spacing, typography} from '@/theme';

export function LoadingState({message = 'Cargando...'}: {message?: string}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.text}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant="outline"
          size="sm"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message = 'Ocurrió un error inesperado.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, styles.errorIcon]}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
      </View>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Button
          title="Reintentar"
          variant="outline"
          size="sm"
          onPress={onRetry}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    height: 60,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 60,
  },
  errorIcon: {backgroundColor: colors.dangerSoft},
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  text: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  action: {marginTop: spacing.lg},
});
