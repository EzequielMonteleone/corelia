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

const COMMUNITY_LINKS: MenuLink[] = [
  {
    href: '/chat',
    icon: 'sparkles-outline',
    label: 'Asistente Corelia',
    description: 'Consultas, reservas y reclamos por chat.',
  },
  {
    href: '/amenities',
    icon: 'calendar-outline',
    label: 'Amenities',
    description: 'Reservá el SUM, la parrilla o el gimnasio.',
  },
  {
    href: '/household',
    icon: 'people-outline',
    label: 'Grupo familiar',
    description: 'Integrantes, vehículos y mascotas.',
  },
  {
    href: '/claims',
    icon: 'chatbox-ellipses-outline',
    label: 'Reclamos',
    description: 'Reportá y seguí incidencias del edificio.',
  },
  {
    href: '/documents',
    icon: 'document-text-outline',
    label: 'Documentos',
    description: 'Reglamentos y avisos del edificio.',
  },
];

const ADMIN_LINKS: MenuLink[] = [
  {
    href: '/buildings',
    icon: 'business-outline',
    label: 'Edificios y unidades',
    description: 'Configuración de propiedades y amenities.',
  },
  {
    href: '/users',
    icon: 'people-circle-outline',
    label: 'Usuarios',
    description: 'Invitaciones, roles y accesos.',
  },
  {
    href: '/roles',
    icon: 'key-outline',
    label: 'Roles y permisos',
    description: 'Niveles de acceso del sistema.',
  },
];

export default function MenuScreen() {
  const router = useRouter();
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

  const community = COMMUNITY_LINKS.filter(link =>
    canAccessPath(user, link.href),
  );
  const administration = ADMIN_LINKS.filter(link =>
    canAccessPath(user, link.href),
  );

  return (
    <Screen>
      <AppHeader title="Menú" subtitle="Todo lo demás, en un solo lugar." />

      <BuildingSwitcher
        buildings={buildings}
        value={activeBuildingId}
        onChange={setSelectedBuildingId}
      />

      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mi perfil"
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
              {user ? `${user.firstName} ${user.lastName}` : 'Mi cuenta'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            <View style={styles.badges}>
              {user?.globalRole === 'SUPERADMIN' ? (
                <Badge label="Superadmin" intent="purple" />
              ) : null}
              {roleNames.map(role => (
                <Badge key={role} label={role} intent="primary" />
              ))}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {community.length > 0 ? (
          <Section title="Comunidad">
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
          <Section title="Administración">
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

        <Section title="Cuenta">
          <View style={styles.list}>
            <MenuRow
              icon="notifications-outline"
              label="Avisos"
              description="Novedades de tus edificios."
              badge={
                unread > 0 ? (unread > 9 ? '9+' : String(unread)) : undefined
              }
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              icon="person-outline"
              label="Mi perfil"
              description="Datos personales y contraseña."
              onPress={() => router.push('/profile')}
            />
            <MenuRow
              icon="log-out-outline"
              label="Cerrar sesión"
              description="Salir de tu cuenta en este dispositivo."
              danger
              onPress={() => setLogoutOpen(true)}
            />
          </View>
        </Section>
      </View>

      <ConfirmDialog
        visible={logoutOpen}
        title="Cerrar sesión"
        description="¿Seguro que querés salir de tu cuenta?"
        confirmLabel="Cerrar sesión"
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
