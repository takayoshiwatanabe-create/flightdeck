import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { AdBanner } from '@/components/ads/AdBanner';
import { type ColorScheme } from '@/types/theme';

export default function TabHomeScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('home.welcome')}</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{t('home.description')}</Text>
      <View style={styles.adContainer}>
        <AdBanner />
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
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  adContainer: {
    marginTop: 'auto', // Push ad to the bottom
    width: '100%',
    alignItems: 'center',
  },
});

function getColors(theme: ColorScheme) {
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
