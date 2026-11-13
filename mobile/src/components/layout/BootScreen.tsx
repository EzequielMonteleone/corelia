import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '@/theme';

export function BootScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>Corelia</Text>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>Cargando tu cuenta...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  text: {color: colors.textSecondary, fontSize: typography.small},
});
