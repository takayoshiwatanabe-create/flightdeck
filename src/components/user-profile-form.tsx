import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, Pressable, View, ActivityIndicator, Alert } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

interface UserProfile {
  name: string;
  email: string; // Read-only
  preferredLanguage: string;
}

interface UserProfileFormProps {
  profile: UserProfile;
  onSave: (updatedData: Partial<UserProfile>) => Promise<void>;
  isSaving: boolean;
}

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

export function UserProfileForm({ profile, onSave, isSaving }: UserProfileFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('settings.profile.form');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [name, setName] = useState<string>(profile.name);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(profile.preferredLanguage);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setError(null);
    if (!name.trim()) {
      setError(t('error.emptyName'));
      return;
    }

    const updatedData: Partial<UserProfile> = {};
    if (name !== profile.name) {
      updatedData.name = name;
    }
    if (preferredLanguage !== profile.preferredLanguage) {
      updatedData.preferredLanguage = preferredLanguage;
    }

    if (Object.keys(updatedData).length === 0) {
      Alert.alert(tCommon('info'), t('noChanges'));
      return;
    }

    await onSave(updatedData);
  };

  const getCurrentLanguageLabel = (langCode: string): string => {
    const lang = supportedLanguages.find(l => l.code === langCode);
    return lang ? lang.label : 'Unknown';
  };

  return (
    <View style={styles.formContainer}>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>{t('emailLabel')}</Text>
      <TextInput
        style={[styles.input, styles.disabledInput, { backgroundColor: colors.inputBackground, color: colors.disabledText, borderColor: colors.inputBorder }]}
        value={profile.email}
        editable={false}
        accessibilityLabel={t('emailLabel')}
      />

      <Text style={[styles.label, { color: colors.text }]}>{t('nameLabel')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
        placeholder={t('namePlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={name}
        onChangeText={setName}
        editable={!isSaving}
        accessibilityLabel={t('nameLabel')}
      />

      <Text style={[styles.label, { color: colors.text }]}>{t('preferredLanguageLabel')}</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        {/* This is a simplified representation. In a real app, you'd use a proper Picker component. */}
        <Text style={[styles.pickerText, { color: colors.inputText }]}>
          {getCurrentLanguageLabel(preferredLanguage)}
        </Text>
        {/* Example: Add a button to open a modal for language selection */}
        <Pressable
          onPress={() => Alert.alert(
            t('selectLanguage'),
            t('languageSelectionHint'),
            supportedLanguages.map(lang => ({
              text: lang.label,
              onPress: () => setPreferredLanguage(lang.code)
            }))
          )}
          style={styles.pickerButton}
          disabled={isSaving}
          accessibilityLabel={t('changeLanguage')}
        >
          <Text style={[styles.pickerButtonText, { color: colors.primary }]}>{t('change')}</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={() => void handleSave()}
        disabled={isSaving}
        accessibilityLabel={t('saveButton')}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
            {t('saveButton')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.6,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  pickerButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#EF4444',
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  disabledText: string;
  primary: string;
  buttonText: string;
  error: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      disabledText: '#6B7280',
      primary: '#22D3EE',
      buttonText: '#1F2937',
      error: '#EF4444',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    inputBackground: '#F9FAFB',
    inputText: '#1F2937',
    inputPlaceholder: '#6B7280',
    inputBorder: '#E5E7EB',
    disabledText: '#9CA3AF',
    primary: '#22D3EE',
    buttonText: '#FFFFFF',
    error: '#EF4444',
    };
}
