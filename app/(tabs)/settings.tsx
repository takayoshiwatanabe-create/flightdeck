import { StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

export default function TabSettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>

      <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.darkMode')}</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <Pressable style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={() => { /* TODO: Implement language selection */ }}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.language')}</Text>
        <Text style={[styles.settingValue, { color: colors.secondaryText }]}>{t('settings.currentLanguage')}</Text>
      </Pressable>

      <Pressable style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={() => { /* TODO: Implement subscription management */ }}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.subscription')}</Text>
        <Text style={[styles.settingValue, { color: colors.secondaryText }]}>{t('settings.manageSubscription')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 18,
  },
  settingValue: {
    fontSize: 16,
  },
});

function getColors(theme: ColorScheme) {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
      border: '#374151',
      switchTrackFalse: '#787880',
      switchTrackTrue: '#22D3EE',
      switchThumb: '#F9FAFB',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    border: '#E5E7EB',
    switchTrackFalse: '#E9E9EA',
    switchTrackTrue: '#22D3EE',
    switchThumb: '#FFFFFF',
  };
}
