import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

export default function TabSearchScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('search.title')}</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{t('search.description')}</Text>
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
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
});

function getColors(theme: ColorScheme): { background: string; text: string; secondaryText: string } {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
  };
}
