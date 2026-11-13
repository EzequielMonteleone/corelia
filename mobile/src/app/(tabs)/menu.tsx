import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {MenuRow} from '@/components/layout/MenuRow';
import {Section} from '@/components/layout/Section';
import {Badge} from '@/components/ui/Badge';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Screen} from '@/components/ui/Screen';
import {useNotifications} from '@/hooks/queries/useNotifications';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {initials} from '@/lib/format';
import {canAccessPath} from '@/lib/navAccess';
import {useAuthStore} from '@/store/authStore';
import {colors, radius, spacing, typography} from '@/theme';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type MenuLink = {
  href:
    | '/chat'
    | '/amenities'
    | '/household'
    | '/claims'
    | '/documents'
    | '/buildings'
    | '/users'
    | '/roles'
    | '/notifications'
    | '/profile';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
};

export default function MenuScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const {buildings, activeBuildingId, setSelectedBuildingId} =
    useActiveBuilding();
  const {data: notifications} = useNotifications();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const unread = notifications?.unreadCount ?? 0;
  const roleNames = Array.from(
    new Set(
      (user?.buildingUsers ?? [])
        .map(membership => membership.role?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  const communityLinks: MenuLink[] = [
    {
      href: '/chat',
      icon: 'sparkles-outline',
      label: t('Menu.assistantLabel'),
      description: t('Menu.assistantDescription'),
    },
    {
      href: '/amenities',
      icon: 'calendar-outline',
      label: t('Menu.amenitiesLabel'),
      description: t('Menu.amenitiesDescription'),
    },
    {
      href: '/household',
      icon: 'people-outline',
      label: t('Menu.householdLabel'),
      description: t('Menu.householdDescription'),
    },
    {
      href: '/claims',
      icon: 'chatbox-ellipses-outline',
      label: t('Menu.claimsLabel'),
      description: t('Menu.claimsDescription'),
    },
    {
      href: '/documents',
      icon: 'document-text-outline',
      label: t('Menu.documentsLabel'),
      description: t('Menu.documentsDescription'),
    },
  ];

  const adminLinks: MenuLink[] = [
    {
      href: '/buildings',
      icon: 'business-outline',
      label: t('Menu.buildingsLabel'),
      description: t('Menu.buildingsDescription'),
    },
    {
      href: '/users',
      icon: 'people-circle-outline',
      label: t('Menu.usersLabel'),
      description: t('Menu.usersDescription'),
    },
    {
      href: '/roles',
      icon: 'key-outline',
      label: t('Menu.rolesLabel'),
      description: t('Menu.rolesDescription'),
    },
  ];

  const community = communityLinks.filter(link =>
    canAccessPath(user, link.href),
  );
  const administration = adminLinks.filter(link =>
    canAccessPath(user, link.href),
  );

  return (
    <Screen>
      <AppHeader title={t('Menu.title')} subtitle={t('Menu.subtitle')} />

      <BuildingSwitcher
        buildings={buildings}
        value={activeBuildingId}
        onChange={setSelectedBuildingId}
      />

      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Menu.viewProfile')}
          onPress={() => router.push('/profile')}
          style={({pressed}) => [
            styles.profileCard,
            pressed && styles.pressed,
          ]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials(user?.firstName, user?.lastName)}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name} numberOfLines={1}>
              {user
                ? `${user.firstName} ${user.lastName}`
                : t('Menu.myAccount')}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            <View style={styles.badges}>
              {user?.globalRole === 'SUPERADMIN' ? (
                <Badge label={t('Common.superadmin')} intent="purple" />
              ) : null}
              {roleNames.map(role => (
                <Badge key={role} label={role} intent="primary" />
              ))}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {community.length > 0 ? (
          <Section title={t('Menu.community')}>
            <View style={styles.list}>
              {community.map(link => (
                <MenuRow
                  key={link.href}
                  icon={link.icon}
                  label={link.label}
                  description={link.description}
                  onPress={() => router.push(link.href)}
                />
              ))}
            </View>
          </Section>
        ) : null}

        {administration.length > 0 ? (
          <Section title={t('Menu.administration')}>
            <View style={styles.list}>
              {administration.map(link => (
                <MenuRow
                  key={link.href}
                  icon={link.icon}
                  label={link.label}
                  description={link.description}
                  onPress={() => router.push(link.href)}
                />
              ))}
            </View>
          </Section>
        ) : null}

        <Section title={t('Menu.account')}>
          <View style={styles.list}>
            <MenuRow
              icon="notifications-outline"
              label={t('Menu.notificationsLabel')}
              description={t('Menu.notificationsDescription')}
              badge={
                unread > 0 ? (unread > 9 ? '9+' : String(unread)) : undefined
              }
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              icon="person-outline"
              label={t('Menu.profileLabel')}
              description={t('Menu.profileDescription')}
              onPress={() => router.push('/profile')}
            />
            <MenuRow
              icon="log-out-outline"
              label={t('Menu.logoutLabel')}
              description={t('Menu.logoutDescription')}
              danger
              onPress={() => setLogoutOpen(true)}
            />
          </View>
        </Section>
      </View>

      <ConfirmDialog
        visible={logoutOpen}
        title={t('Menu.logoutLabel')}
        description={t('Menu.logoutConfirmDescription')}
        confirmLabel={t('Menu.logoutLabel')}
        destructive
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xxl},
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {opacity: 0.82},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  avatarText: {
    color: colors.indigo,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  profileText: {flex: 1, gap: 2},
  name: {color: colors.text, fontSize: typography.h3, fontWeight: '700'},
  email: {color: colors.textMuted, fontSize: typography.small},
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  list: {gap: spacing.sm},
});
