import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LoginForm} from '@/components/auth/LoginForm';
import {useLoginMutation} from '@/hooks/queries/useAuth';
import {errorMessage} from '@/lib/apiError';
import {colors} from '@/theme';

export default function LoginScreen() {
  const login = useLoginMutation();
  const error = login.error ? errorMessage(login.error) : null;

  return (
    <LinearGradient
      colors={['#050507', '#0d1224', '#0a0a0a']}
      style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.glowBlue} />
            <View style={styles.glowIndigo} />
            <LoginForm
              pending={login.isPending}
              error={error}
              onSubmit={values => login.mutate(values)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {backgroundColor: colors.background, flex: 1},
  safe: {flex: 1},
  flex: {flex: 1},
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  glowBlue: {
    backgroundColor: 'rgba(37,99,235,0.20)',
    borderRadius: 999,
    height: 260,
    position: 'absolute',
    right: -120,
    top: -60,
    width: 260,
  },
  glowIndigo: {
    backgroundColor: 'rgba(99,102,241,0.14)',
    borderRadius: 999,
    bottom: -100,
    height: 300,
    left: -150,
    position: 'absolute',
    width: 300,
  },
});
