import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

export default function NotFoundScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('notFound.heading')}</Text>
        <Link href="/" style={[styles.link, { color: colors.link }]}>
          <Text style={[styles.linkText, { color: colors.link }]}>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
});

function getColors(theme: ColorScheme): { background: string; text: string; link: string } {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      link: '#22D3EE',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    link: '#007AFF',
  };
}
