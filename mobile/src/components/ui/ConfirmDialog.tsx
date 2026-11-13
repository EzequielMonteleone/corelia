import {Button} from '@/components/ui/Button';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {colors, spacing, typography} from '@/theme';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel,
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
  const {t} = useTranslation();

  return (
    <ModalSheet visible={visible} onClose={onCancel} title={title}>
      <View style={styles.body}>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actions}>
          <Button
            title={cancelLabel ?? t('Common.cancel')}
            variant="ghost"
            onPress={onCancel}
            disabled={pending}
            style={styles.action}
          />
          <Button
            title={confirmLabel ?? t('Common.confirm')}
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
