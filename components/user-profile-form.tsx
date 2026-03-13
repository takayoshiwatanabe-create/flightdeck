import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, Pressable, View, ActivityIndicator, Alert } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export function UserProfileForm({ profile, onSave, isSaving }: UserProfileFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('settings.profile.form');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [name, setName] = useState<string>(profile.name);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(profile.preferredLanguage);
  const [isEditingLanguage, setIsEditingLanguage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(profile.name);
    setPreferredLanguage(profile.preferredLanguage);
  }, [profile]);

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

    if (Object.keys(updatedData).length > 0) {
      await onSave(updatedData);
    } else {
      Alert.alert(tCommon('info'), t('noChanges'));
    }
  };

  const getCurrentLanguageLabel = (currentLocale: string): string => {
    const lang = supportedLanguages.find(l => l.code === currentLocale);
    return lang ? lang.label : 'Unknown';
  };

  return (
    <View style={styles.formContainer}>
      {error && <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>}

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('emailLabel')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.secondaryText, borderColor: colors.inputBorder }]}
          value={profile.email}
          editable={false} // Email is read-only
          accessibilityLabel={t('emailLabel')}
        />
      </View>

      <View style={styles.inputGroup}>
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
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('languageLabel')}</Text>
        <Pressable
          style={[styles.languagePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
          onPress={() => setIsEditingLanguage(true)}
          disabled={isSaving}
          accessibilityLabel={t('languageLabel')}
        >
          <Text style={[styles.languagePickerText, { color: colors.inputText }]}>
            {getCurrentLanguageLabel(preferredLanguage)}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.icon} />
        </Pressable>
      </View>

      {isEditingLanguage && (
        <View style={[styles.languageOptionsContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {supportedLanguages.map((lang) => (
            <Pressable
              key={lang.code}
              style={({ pressed }) => [
                styles.languageOption,
                {
                  backgroundColor: preferredLanguage === lang.code ? colors.primaryLight : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => {
                setPreferredLanguage(lang.code);
                setIsEditingLanguage(false);
              }}
              accessibilityLabel={lang.label}
            >
              <Text style={[styles.languageOptionText, { color: colors.text }]}>
                {lang.label}
              </Text>
              {preferredLanguage === lang.code && (
                <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed || isSaving ? 0.7 : 1,
          },
        ]}
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  languagePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  languagePickerText: {
    fontSize: 16,
  },
  languageOptionsContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -10, // Overlap with the picker button for a dropdown effect
    marginBottom: 20,
    maxHeight: 200,
    overflow: 'hidden',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  languageOptionText: {
    fontSize: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
});

function getColors(theme: ColorScheme): {
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  primary: string;
  primaryLight: string;
  buttonText: string;
  icon: string;
  text: string;
  secondaryText: string;
  errorText: string;
  cardBg: string;
  border: string;
} {
  if (theme === 'dark') {
    return {
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      primary: '#22D3EE', // Cyan
      primaryLight: '#22D3EE30',
      buttonText: '#1F2937',
      icon: '#D1D5DB',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      errorText: '#EF4444',
      cardBg: '#1F2937',
      border: '#374151',
    };
  }
  return {
    inputBackground: '#F9FAFB',
    inputText: '#1F2937',
    inputPlaceholder: '#6B7280',
    inputBorder: '#E5E7EB',
    primary: '#22D3EE', // Cyan
    primaryLight: '#22D3EE15',
    buttonText: '#FFFFFF',
    icon: '#6B7280',
    text: '#1F2937',
    secondaryText: '#6B7280',
    errorText: '#EF4444',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
  };
}
