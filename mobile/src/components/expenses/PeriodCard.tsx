import {IconButton} from '@/components/layout/AppHeader';
import {Badge} from '@/components/ui/Badge';
import {formatDate} from '@/lib/format';
import {colors, radius, spacing, typography} from '@/theme';
import type {ExpensePeriod} from '@/types/expense';
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';

export function PeriodCard({
  period,
  canManage,
  onPress,
  onDelete,
}: {
  period: ExpensePeriod;
  canManage: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const {t} = useTranslation();
  const count = period._count?.expenses;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Expenses.periodAccessibility', {
          period: period.period,
        })}
        onPress={onPress}
        style={({pressed}) => [styles.main, pressed && styles.pressed]}>
        <View style={styles.icon}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{period.period}</Text>
          <Text style={styles.meta}>
            {t('Expenses.generatedOn', {date: formatDate(period.generatedAt)})}
            {count !== undefined
              ? ` · ${t('Expenses.periodCount', {count})}`
              : ''}
          </Text>
        </View>
        <Badge
          label={
            period.status === 'OPEN'
              ? t('Expenses.statusOpen')
              : t('Expenses.statusClosed')
          }
          intent={period.status === 'OPEN' ? 'success' : 'default'}
        />
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {canManage ? (
        <View style={styles.actions}>
          <IconButton
            icon="trash-outline"
            label={t('Expenses.deletePeriodAccessibility', {
              period: period.period,
            })}
            onPress={onDelete}
            tint={colors.danger}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  main: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {backgroundColor: 'rgba(255,255,255,0.03)'},
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  text: {flex: 1, gap: 2},
  title: {color: colors.text, fontSize: typography.body, fontWeight: '700'},
  meta: {color: colors.textMuted, fontSize: typography.caption, lineHeight: 16},
  actions: {paddingRight: spacing.sm},
});
