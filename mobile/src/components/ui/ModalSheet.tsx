import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {colors, radius, spacing, typography} from '@/theme';

export interface ModalSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  testID?: string;
}

export function ModalSheet({
  visible,
  title,
  onClose,
  children,
  testID,
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root} testID={testID}>
        <Pressable
          accessibilityLabel="Cerrar"
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title}>{title ?? ''}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={10}
              onPress={onClose}
              style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderColor: colors.border,
    borderWidth: 1,
    maxHeight: '90%',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.md,
    width: 44,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: typography.h1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  content: {paddingBottom: spacing.md},
});
