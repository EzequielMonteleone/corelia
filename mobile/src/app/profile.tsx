import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {Section} from '@/components/layout/Section';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Input} from '@/components/ui/Input';
import {ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useProfile, useUpdateUser} from '@/hooks/queries/useUsers';
import {profileSchema, type ProfileFormValues} from '@/schemas/user';
import {errorMessage} from '@/lib/apiError';
import {initials} from '@/lib/format';
import {useAuthStore} from '@/store/authStore';
import {toast} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrador',
  Owner: 'Propietario',
  Roomer: 'Inquilino',
};

export default function ProfileScreen() {
  const router = useRouter();
  const authUser = useAuthStore(state => state.user);
  const patchUser = useAuthStore(state => state.patchUser);
  const logout = useAuthStore(state => state.logout);
  const profileQuery = useProfile();
  const updateUser = useUpdateUser();
  const profile = profileQuery.data ?? authUser;

  const [email, setEmail] = useState(authUser?.email ?? '');
  const [firstName, setFirstName] = useState(authUser?.firstName ?? '');
  const [lastName, setLastName] = useState(authUser?.lastName ?? '');
  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Hydrate the form once the profile query resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(profile.email);
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setPhone(profile.phone ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const submit = () => {
    if (!profile) return;
    if (password && !currentPassword.trim()) {
      setErrors({currentPassword: 'Ingresá tu contraseña actual.'});
      return;
    }
    const payload: ProfileFormValues = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      password,
      currentPassword: password ? currentPassword : undefined,
    };
    const result = profileSchema.safeParse(payload);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? 'form');
        if (!next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    updateUser.mutate(
      {
        id: profile.id,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        ...(payload.password ? {passwordPlain: payload.password} : {}),
        ...(payload.password && payload.currentPassword
          ? {currentPassword: payload.currentPassword}
          : {}),
      },
      {
        onSuccess: updated => {
          patchUser({
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phone: updated.phone || undefined,
          });
          setPassword('');
          setCurrentPassword('');
          setErrors({});
          toast.success('Perfil actualizado correctamente.');
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  if (profileQuery.isLoading && !profile) {
    return (
      <RequireAccess path="/profile">
        <Screen>
          <AppHeader
            title="Mi perfil"
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message="Cargando perfil..." />
        </Screen>
      </RequireAccess>
    );
  }

  if (profileQuery.isError && !profile) {
    return (
      <RequireAccess path="/profile">
        <Screen>
          <AppHeader
            title="Mi perfil"
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message="No pudimos cargar tu perfil."
            onRetry={() => profileQuery.refetch()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  if (!profile) return null;

  const buildingRoles = profile.buildingUsers ?? [];
  const canManageProfile = !profileQuery.isError;

  return (
    <RequireAccess path="/profile">
      <Screen
        refreshing={profileQuery.isRefetching}
        onRefresh={() => profileQuery.refetch()}>
        <AppHeader
          title="Mi perfil"
          subtitle="Tus datos personales y seguridad."
          showBell={false}
          onBack={() => router.back()}
        />

        <View style={styles.content}>
          <Card style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initials(profile.firstName, profile.lastName)}
              </Text>
            </View>
            <Text style={styles.name}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.email}>{profile.email}</Text>
            <View style={styles.badges}>
              <Badge
                label={
                  profile.globalRole === 'SUPERADMIN' ? 'Superadmin' : 'Usuario'
                }
                intent={profile.globalRole === 'SUPERADMIN' ? 'purple' : 'default'}
              />
              {buildingRoles.map(link => (
                <Badge
                  key={link.id}
                  label={
                    link.role
                      ? `${ROLE_LABELS[link.role.name] ?? link.role.name} · ${
                          link.building?.name ?? 'Edificio'
                        }`
                      : (link.building?.name ?? 'Edificio')
                  }
                  intent="primary"
                />
              ))}
            </View>
          </Card>

          <Section title="Datos personales">
            <Card style={styles.form}>
              <View style={styles.row}>
                <Input
                  label="Nombre"
                  value={firstName}
                  onChangeText={value => {
                    setFirstName(value);
                    if (errors.firstName) {
                      setErrors(current => ({...current, firstName: ''}));
                    }
                  }}
                  error={errors.firstName || undefined}
                  containerStyle={styles.half}
                />
                <Input
                  label="Apellido"
                  value={lastName}
                  onChangeText={value => {
                    setLastName(value);
                    if (errors.lastName) {
                      setErrors(current => ({...current, lastName: ''}));
                    }
                  }}
                  error={errors.lastName || undefined}
                  containerStyle={styles.half}
                />
              </View>
              <Input
                label="Email"
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  if (errors.email) {
                    setErrors(current => ({...current, email: ''}));
                  }
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email || undefined}
              />
              <Input
                label="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                error={errors.phone || undefined}
              />
            </Card>
          </Section>

          <Section title="Seguridad">
            <Card style={styles.form}>
              <Input
                label="Nueva contraseña (opcional)"
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors(current => ({...current, password: ''}));
                  }
                }}
                secureTextEntry
                error={errors.password || undefined}
                hint="Mínimo 8 caracteres."
              />
              {password ? (
                <Input
                  label="Contraseña actual"
                  value={currentPassword}
                  onChangeText={value => {
                    setCurrentPassword(value);
                    if (errors.currentPassword) {
                      setErrors(current => ({...current, currentPassword: ''}));
                    }
                  }}
                  secureTextEntry
                  error={errors.currentPassword || undefined}
                />
              ) : null}
            </Card>
          </Section>

          <Button
            title="Guardar cambios"
            fullWidth
            size="lg"
            loading={updateUser.isPending}
            disabled={!canManageProfile}
            onPress={submit}
          />

          <Button
            title="Cerrar sesión"
            variant="destructive"
            fullWidth
            icon={
              <Ionicons
                name="log-out-outline"
                size={18}
                color={colors.danger}
              />
            }
            onPress={() => setLogoutOpen(true)}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Corelia · Gestión de edificios</Text>
          </View>
        </View>

        <ConfirmDialog
          visible={logoutOpen}
          title="Cerrar sesión"
          description="¿Seguro que querés salir de tu cuenta?"
          confirmLabel="Cerrar sesión"
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false);
            logout();
          }}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.xl},
  identity: {alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl},
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 72,
  },
  avatarText: {
    color: colors.indigo,
    fontSize: typography.h1,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  email: {color: colors.textMuted, fontSize: typography.small},
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  form: {gap: spacing.md},
  row: {flexDirection: 'row', gap: spacing.md},
  half: {flex: 1},
  footer: {alignItems: 'center', paddingVertical: spacing.md},
  footerText: {color: colors.textMuted, fontSize: typography.caption},
  radiusNote: {borderRadius: radius.md},
});
