import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {flattenError} from 'zod';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {validationMessage} from '@/lib/validation';
import {loginSchema, type LoginFormValues} from '@/schemas/auth';
import {colors, radius, spacing, typography} from '@/theme';

export interface LoginFormProps {
  pending: boolean;
  error?: string | null;
  onSubmit: (values: LoginFormValues) => void;
}

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

export function LoginForm({pending, error, onSubmit}: LoginFormProps) {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = () => {
    const result = loginSchema.safeParse({email: email.trim(), password});
    if (!result.success) {
      const flattened = flattenError(result.error).fieldErrors;
      setErrors({
        email: validationMessage(t, flattened.email?.[0]),
        password: validationMessage(t, flattened.password?.[0]),
      });
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <View style={styles.card}>
      <View style={styles.brand}>
        <Text style={styles.logo}>{t('Common.title')}</Text>
        <Text style={styles.brandTag}>{t('Login.brand')}</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{t('Login.welcome')}</Text>
        <Text style={styles.subtitle}>{t('Login.subtitle')}</Text>
      </View>

      <View style={styles.fields}>
        <Input
          label={t('Login.email')}
          placeholder={t('Login.emailPlaceholder')}
          value={email}
          onChangeText={value => {
            setEmail(value);
            if (errors.email) setErrors(current => ({...current, email: undefined}));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          error={errors.email}
          testID="login-email"
        />
        <Input
          label={t('Login.password')}
          placeholder={t('Login.passwordPlaceholder')}
          value={password}
          onChangeText={value => {
            setPassword(value);
            if (errors.password) {
              setErrors(current => ({...current, password: undefined}));
            }
          }}
          secureTextEntry
          textContentType="password"
          error={errors.password}
          testID="login-password"
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Button
        title={pending ? t('Login.submitting') : t('Login.submit')}
        loading={pending}
        fullWidth
        size="lg"
        onPress={submit}
        testID="login-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(17,19,24,0.94)',
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.4,
    shadowRadius: 28,
    width: '100%',
  },
  brand: {alignItems: 'center', gap: spacing.xs},
  logo: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  brandTag: {
    color: colors.indigo,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heading: {alignItems: 'center', gap: spacing.xs},
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    textAlign: 'center',
  },
  fields: {gap: spacing.lg},
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(248,113,113,0.28)',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: '600',
    textAlign: 'center',
  },
});