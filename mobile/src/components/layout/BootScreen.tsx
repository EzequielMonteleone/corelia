import {BrandLogo} from '@/components/brand/BrandLogo';
import {colors, spacing, typography} from '@/theme';
import {useTranslation} from 'react-i18next';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

export function BootScreen() {
  const {t} = useTranslation();

  return (
    <View style={styles.root}>
      <BrandLogo size={48} />
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
  text: {color: colors.textSecondary, fontSize: typography.small},
});
