import {KpiCard} from '@/components/dashboard/KpiCard';
import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {Section} from '@/components/layout/Section';
import {Badge} from '@/components/ui/Badge';
import {Card} from '@/components/ui/Card';
import {Screen} from '@/components/ui/Screen';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {useCollectionSummary} from '@/hooks/queries/useExpenses';
import {useNotifications} from '@/hooks/queries/useNotifications';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {currentLocaleTag} from '@/i18n';
import {formatCurrency, formatDateTime, formatLongDate} from '@/lib/format';
import {canAccessPath} from '@/lib/navAccess';
import {notificationTarget} from '@/lib/notificationLink';
import {notificationPhrase} from '@/lib/notificationText';
import {APP_TIMEZONE} from '@/lib/zonedTime';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {colors, radius, spacing, typography} from '@/theme';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type QuickLink = {
  href: '/buildings' | '/expenses' | '/users' | '/claims' | '/amenities';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const user = useAuthStore(state => state.user);
  const {
    buildings,
    activeBuilding,
    activeBuildingId,
    setSelectedBuildingId,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useActiveBuilding();
  const summaryQuery = useCollectionSummary(
    activeBuilding?.canManage ? activeBuildingId : null,
  );
  const notificationsQuery = useNotifications();

  const summary = summaryQuery.data;
  const setAppBuilding = useAppStore(state => state.setSelectedBuildingId);

  const quickLinks = useMemo(() => {
    const links: QuickLink[] = [
      {
        href: '/expenses',
        title: t('Dashboard.quickExpensesTitle'),
        description: t('Dashboard.quickExpensesDescription'),
        icon: 'receipt-outline',
        tint: colors.primary,
      },
      {
        href: '/amenities',
        title: t('Amenities.title'),
        description: t('Dashboard.quickAmenitiesDescription'),
        icon: 'sparkles-outline',
        tint: colors.purple,
      },
    ];
    if (canAccessPath(user, '/buildings')) {
      links.unshift({
        href: '/buildings',
        title: t('Dashboard.quickBuildingsTitle'),
        description: t('Dashboard.quickBuildingsDescription'),
        icon: 'business-outline',
        tint: colors.indigo,
      });
    }
    if (canAccessPath(user, '/users')) {
      links.push({
        href: '/users',
        title: t('Dashboard.quickUsersTitle'),
        description: t('Dashboard.quickUsersDescription'),
        icon: 'people-outline',
        tint: colors.success,
      });
    }
    if (canAccessPath(user, '/claims')) {
      links.push({
        href: '/claims',
        title: t('Dashboard.quickClaimsTitle'),
        description: t('Dashboard.quickClaimsDescription'),
        icon: 'chatbox-ellipses-outline',
        tint: colors.warning,
      });
    }
    return links;
  }, [t, user]);

  const recentNotifications =
    notificationsQuery.data?.notifications.slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <Screen>
        <AppHeader title={t('Tabs.home')} />
        <LoadingState message={t('Dashboard.loading')} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <AppHeader title={t('Tabs.home')} />
        <ErrorState
          message={t('Dashboard.buildingsError')}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={() => {
        refetch();
        summaryQuery.refetch();
        notificationsQuery.refetch();
      }}>
      <AppHeader
        title={t('Dashboard.greeting', {
          name: user?.firstName ?? t('Dashboard.defaultName'),
        })}
        subtitle={formatLongDate(new Date(), currentLocaleTag(), APP_TIMEZONE)}
      />

      <BuildingSwitcher
        buildings={buildings}
        value={activeBuildingId}
        onChange={setSelectedBuildingId}
      />

      {!activeBuilding ? (
        <EmptyState
          icon="business-outline"
          title={t('Dashboard.noBuildingsTitle')}
          description={
            buildings.length > 1
              ? t('Dashboard.noBuildingsChoose')
              : t('Dashboard.noBuildingsSingle')
          }
        />
      ) : (
        <View style={styles.content}>
          <Card style={styles.buildingCard}>
            <View style={styles.buildingHeader}>
              <View style={styles.buildingIcon}>
                <Ionicons name="business" size={22} color={colors.primary} />
              </View>
              <View style={styles.buildingText}>
                <Text style={styles.buildingName} numberOfLines={1}>
                  {activeBuilding.name}
                </Text>
                <Text style={styles.buildingAddress} numberOfLines={2}>
                  {activeBuilding.address}
                  {activeBuilding.city ? ` · ${activeBuilding.city}` : ''}
                </Text>
              </View>
              <Badge
                label={
                  activeBuilding.active
                    ? t('Common.active')
                    : t('Common.inactive')
                }
                intent={activeBuilding.active ? 'success' : 'danger'}
              />
            </View>
          </Card>

          {summary ? (
            <Section title={t('Dashboard.collectionSummary')}>
              <View style={styles.kpiRow}>
                <KpiCard
                  icon="alert-circle-outline"
                  label={t('Dashboard.kpiDebt')}
                  value={formatCurrency(summary.debtTotal)}
                  tint={colors.danger}
                />
                <KpiCard
                  icon="checkmark-circle-outline"
                  label={t('Dashboard.kpiCollected')}
                  value={formatCurrency(summary.totalPaid)}
                  tint={colors.success}
                />
              </View>
              <View style={styles.kpiRow}>
                <KpiCard
                  icon="trending-up-outline"
                  label={t('Dashboard.kpiCollectionRate')}
                  value={`${summary.collectionRate.toFixed(1)}%`}
                  tint={colors.primary}
                />
                <KpiCard
                  icon="home-outline"
                  label={t('Dashboard.kpiUnitsWithDebt')}
                  value={String(summary.unitsWithDebtCount)}
                  tint={colors.warning}
                />
              </View>
            </Section>
          ) : null}

          <Section title={t('Dashboard.quickAccess')}>
            <View style={styles.quickGrid}>
              {quickLinks.map(link => (
                <Card
                  key={link.href}
                  style={styles.quickCard}
                  accessibilityLabel={link.title}
                  onPress={() => router.push(link.href)}>
                  <View
                    style={[
                      styles.quickIcon,
                      {backgroundColor: `${link.tint}22`},
                    ]}>
                    <Ionicons name={link.icon} size={20} color={link.tint} />
                  </View>
                  <Text style={styles.quickTitle}>{link.title}</Text>
                  <Text style={styles.quickDescription}>
                    {link.description}
                  </Text>
                </Card>
              ))}
            </View>
          </Section>

          {recentNotifications.length > 0 ? (
            <Section
              title={t('Dashboard.recentNotices')}
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Dashboard.viewAllAria')}
                  onPress={() => router.push('/notifications')}>
                  <Text style={styles.link}>{t('Dashboard.viewAll')}</Text>
                </Pressable>
              }>
              <Card style={styles.notificationList}>
                {recentNotifications.map((item, index) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setAppBuilding(item.buildingId);
                      router.push(notificationTarget(item));
                    }}
                    style={({pressed}) => [
                      styles.notificationRow,
                      index > 0 && styles.notificationDivider,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.notificationDotWrap}>
                      {!item.readAt ? <View style={styles.unreadDot} /> : null}
                      <Ionicons
                        name={
                          item.kind === 'CLAIM_UPDATED'
                            ? 'chatbox-ellipses-outline'
                            : 'document-text-outline'
                        }
                        size={19}
                        color={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.notificationText}>
                      <Text style={styles.notificationTitle} numberOfLines={2}>
                        {notificationPhrase(item)}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {formatDateTime(item.createdAt)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ))}
              </Card>
            </Section>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xxl},
  buildingCard: {gap: spacing.sm},
  buildingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  buildingIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  buildingText: {flex: 1, gap: 2},
  buildingName: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  buildingAddress: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 18,
  },
  kpiRow: {flexDirection: 'row', gap: spacing.md},
  quickGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md},
  quickCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 34,
  },
  quickTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  quickDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  link: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  notificationList: {gap: 0, padding: 0},
  notificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notificationDivider: {borderTopColor: colors.border, borderTopWidth: 1},
  notificationDotWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  unreadDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 7,
    position: 'absolute',
    right: -2,
    top: 1,
    width: 7,
    zIndex: 1,
  },
  notificationText: {flex: 1, gap: 2},
  notificationTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
    lineHeight: 18,
  },
  notificationDate: {color: colors.textMuted, fontSize: typography.caption},
  pressed: {opacity: 0.75},
});
