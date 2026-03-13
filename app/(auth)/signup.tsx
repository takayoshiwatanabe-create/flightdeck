import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { AuthForm } from '@/components/AuthForm';
import { type ColorScheme } from '@/types/theme';

export default function SignUpScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const handleSignUp = (email: string, password: string): void => {
    console.log('Sign up attempt:', { email, password });
    // TODO: Implement actual sign up logic with NextAuth.js API
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('auth.signup.title')}</Text>
      <AuthForm type="signup" onSubmit={handleSignUp} />
      <View style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: colors.secondaryText }]}>
          {t('auth.signup.hasAccount')}
        </Text>
        <Link href="/login" style={[styles.link, { color: colors.link }]}>
          {t('auth.signup.login')}
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  linkContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

function getColors(theme: ColorScheme): { background: string; text: string; secondaryText: string; link: string } {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
      link: '#22D3EE',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    link: '#007AFF',
  };
}
