import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {colors, spacing, typography} from '@/theme';

export function BootScreen() {
  const {t} = useTranslation();

  return (
    <View style={styles.root}>
      <Text style={styles.logo}>{t('Common.title')}</Text>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{t('Common.loadingAccount')}</Text>
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