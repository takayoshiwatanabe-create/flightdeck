import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  Pressable,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

// Define supported languages as per CLAUDE.md
const supportedLanguages = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文 (简体)' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function TabSettingsScreen(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageSelect = (newLocale: string): void => {
    setShowLanguagePicker(false);
    // Use router.replace to change the locale in the URL
    router.replace(`/${newLocale}/(tabs)/settings`);
    Alert.alert(t('languageRestart'));
  };

  // Function to get the display name for the current language
  const getCurrentLanguageLabel = (currentLocale: string): string => {
    const lang = supportedLanguages.find(l => l.code === currentLocale);
    return lang ? lang.label : 'Unknown';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('title')}</Text>

      {/* Dark mode toggle */}
      <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('darkMode')}</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
          thumbColor={colors.switchThumb}
        />
      </View>

      {/* Language selection */}
      <Pressable
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        onPress={() => setShowLanguagePicker(true)}
        accessibilityLabel={t('language')}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('language')}</Text>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: colors.secondaryText }]}>
            {getCurrentLanguageLabel(locale)}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondaryText} />
        </View>
      </Pressable>

      {/* Subscription */}
      <Pressable
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        onPress={() => {
          /* TODO: Implement subscription management */
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('subscription')}</Text>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: colors.secondaryText }]}>
            {t('manageSubscription')}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondaryText} />
        </View>
      </Pressable>

      {/* Language picker modal */}
      <Modal
        visible={showLanguagePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('selectLanguage')}
              </Text>
              <Pressable
                onPress={() => setShowLanguagePicker(false)}
                accessibilityLabel={tCommon('cancel')}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.secondaryText} />
              </Pressable>
            </View>
            <FlatList
              data={supportedLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.languageItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Text style={[styles.languageLabel, { color: colors.text }]}>{item.label}</Text>
                  {item.code === locale ? (
                    <MaterialCommunityIcons name="check" size={20} color="#22D3EE" />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
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
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageLabel: {
    fontSize: 17,
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  border: string;
  switchTrackFalse: string;
  switchTrackTrue: string;
  switchThumb: string;
  modalBg: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
      border: '#374151',
      switchTrackFalse: '#787880',
      switchTrackTrue: '#22D3EE',
      switchThumb: '#F9FAFB',
      modalBg: '#1F2937',
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
    modalBg: '#FFFFFF',
  };
}

