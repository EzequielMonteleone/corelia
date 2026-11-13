import {StyleSheet, Text, View} from 'react-native';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {colors, spacing, typography} from '@/theme';

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  pending = false,
  destructive = true,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalSheet visible={visible} onClose={onCancel} title={title}>
      <View style={styles.body}>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actions}>
          <Button
            title={cancelLabel}
            variant="ghost"
            onPress={onCancel}
            disabled={pending}
            style={styles.action}
          />
          <Button
            title={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            onPress={onConfirm}
            loading={pending}
            style={styles.action}
          />
        </View>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: {gap: spacing.xl, paddingTop: spacing.sm},
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  actions: {flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end'},
  action: {flex: 1},
});
