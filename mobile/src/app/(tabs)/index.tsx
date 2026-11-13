import {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {Section} from '@/components/layout/Section';
import {KpiCard} from '@/components/dashboard/KpiCard';
import {Card} from '@/components/ui/Card';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {Badge} from '@/components/ui/Badge';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {useCollectionSummary} from '@/hooks/queries/useExpenses';
import {useNotifications} from '@/hooks/queries/useNotifications';
import {canAccessPath} from '@/lib/navAccess';
import {formatCurrency, formatDateTime, formatLongDate} from '@/lib/format';
import {notificationPhrase} from '@/lib/notificationText';
import {notificationTarget} from '@/lib/notificationLink';
import {useAuthStore} from '@/store/authStore';
import {useAppStore} from '@/store/appStore';
import {APP_TIMEZONE} from '@/lib/zonedTime';
import {colors, radius, spacing, typography} from '@/theme';

type QuickLink = {
  href: '/buildings' | '/expenses' | '/users' | '/claims' | '/amenities';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

export default function DashboardScreen() {
  const router = useRouter();
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
        title: 'Expensas',
        description: 'Períodos, pagos y exportaciones.',
        icon: 'receipt-outline',
        tint: colors.primary,
      },
      {
        href: '/amenities',
        title: 'Amenities',
        description: 'Reservá espacios comunes.',
        icon: 'sparkles-outline',
        tint: colors.purple,
      },
    ];
    if (canAccessPath(user, '/buildings')) {
      links.unshift({
        href: '/buildings',
        title: 'Edificios',
        description: 'Unidades y amenities.',
        icon: 'business-outline',
        tint: colors.indigo,
      });
    }
    if (canAccessPath(user, '/users')) {
      links.push({
        href: '/users',
        title: 'Usuarios',
        description: 'Accesos y roles del edificio.',
        icon: 'people-outline',
        tint: colors.success,
      });
    }
    if (canAccessPath(user, '/claims')) {
      links.push({
        href: '/claims',
        title: 'Reclamos',
        description: 'Seguimiento de incidencias.',
        icon: 'chatbox-ellipses-outline',
        tint: colors.warning,
      });
    }
    return links;
  }, [user]);

  const recentNotifications = notificationsQuery.data?.notifications.slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <Screen>
        <AppHeader title="Inicio" />
        <LoadingState message="Cargando tu panel..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <AppHeader title="Inicio" />
        <ErrorState
          message="No pudimos cargar tus edificios."
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
        title={`Hola, ${user?.firstName ?? 'vecino'}`}
        subtitle={formatLongDate(new Date(), 'es-AR', APP_TIMEZONE)}
      />

      <BuildingSwitcher
        buildings={buildings}
        value={activeBuildingId}
        onChange={setSelectedBuildingId}
      />

      {!activeBuilding ? (
        <EmptyState
          icon="business-outline"
          title="Sin edificios asignados"
          description={
            buildings.length > 1
              ? 'Elegí un edificio para ver su información.'
              : 'Cuando te asignen un edificio vas a ver acá el resumen de expensas.'
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
                label={activeBuilding.active ? 'Activo' : 'Inactivo'}
                intent={activeBuilding.active ? 'success' : 'danger'}
              />
            </View>
          </Card>

          {summary ? (
            <Section title="Resumen de cobranza">
              <View style={styles.kpiRow}>
                <KpiCard
                  icon="alert-circle-outline"
                  label="Deuda total"
                  value={formatCurrency(summary.debtTotal)}
                  tint={colors.danger}
                />
                <KpiCard
                  icon="checkmark-circle-outline"
                  label="Cobrado"
                  value={formatCurrency(summary.totalPaid)}
                  tint={colors.success}
                />
              </View>
              <View style={styles.kpiRow}>
                <KpiCard
                  icon="trending-up-outline"
                  label="Cobranza"
                  value={`${summary.collectionRate.toFixed(1)}%`}
                  tint={colors.primary}
                />
                <KpiCard
                  icon="home-outline"
                  label="Unidades con deuda"
                  value={String(summary.unitsWithDebtCount)}
                  tint={colors.warning}
                />
              </View>
            </Section>
          ) : null}

          <Section title="Accesos rápidos">
            <View style={styles.quickGrid}>
              {quickLinks.map(link => (
                <Card
                  key={link.href}
                  style={styles.quickCard}
                  accessibilityLabel={link.title}
                  onPress={() => router.push(link.href)}>
                  <View style={[styles.quickIcon, {backgroundColor: `${link.tint}22`}]}>
                    <Ionicons name={link.icon} size={20} color={link.tint} />
                  </View>
                  <Text style={styles.quickTitle}>{link.title}</Text>
                  <Text style={styles.quickDescription}>{link.description}</Text>
                </Card>
              ))}
            </View>
          </Section>

          {recentNotifications.length > 0 ? (
            <Section
              title="Avisos recientes"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos los avisos"
                  onPress={() => router.push('/notifications')}>
                  <Text style={styles.link}>Ver todos</Text>
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
