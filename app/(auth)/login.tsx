import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { AuthForm } from '@/components/AuthForm';
import { type ColorScheme } from '@/types/theme';
import { login } from '@/src/lib/actions/auth'; // Import the login action

export default function LoginScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    console.log('Login attempt:', { email, password });
    // TODO: Implement actual login logic with NextAuth.js API
    const success = await login(email, password); // Call the backend login action
    if (success) {
      console.log('Login successful!');
      // Navigate to main app or set user session
    } else {
      console.log('Login failed!');
      // Show error message to user
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('auth.login.title')}</Text>
      <AuthForm type="login" onSubmit={handleLogin} />
      <View style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: colors.secondaryText }]}>
          {t('auth.login.noAccount')}
        </Text>
        <Link href="/signup" style={[styles.link, { color: colors.link }]}>
          {t('auth.login.signUp')}
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
