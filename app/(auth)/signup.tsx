import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { AuthForm } from '@/components/AuthForm';
import { type ColorScheme } from '@/types/theme';
import { signup } from '@/src/lib/actions/auth';

export default function SignUpScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('auth.signup');

  const handleSignUp = async (email: string, password: string): Promise<void> => {
    // console.log('Sign up attempt:', { email, password }); // Removed for production readiness
    // TODO: Implement actual sign up logic with NextAuth.js API
    const success: boolean = await signup(email, password); // Call the backend signup action
    if (success) {
      console.log('Sign up successful!');
      // Navigate to login or main app
    } else {
      console.log('Sign up failed!');
      // Show error message to user
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('title')}</Text>
      <AuthForm type="signup" onSubmit={handleSignUp} />
      <View style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: colors.secondaryText }]}>
          {t('hasAccount')}
        </Text>
        <Link href="/login" style={[styles.link, { color: colors.link }]}>
          {t('login')}
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


