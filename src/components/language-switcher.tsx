import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LanguageSwitcherProps {
  onSelect: (locale: string) => void;
  supportedLanguages: Array<{ code: string; label: string }>;
}

export function LanguageSwitcher({ onSelect, supportedLanguages }: LanguageSwitcherProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const locale = useLocale();
  const t = useTranslations('settings');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {supportedLanguages.map((lang) => (
        <Pressable
          key={lang.code}
          style={[styles.languageItem, { borderBottomColor: colors.border }]}
          onPress={() => onSelect(lang.code)}
          accessibilityLabel={lang.label}
        >
          <Text style={[styles.languageLabel, { color: colors.text }]}>{lang.label}</Text>
          {lang.code === locale ? (
            <MaterialCommunityIcons name="check" size={20} color="#22D3EE" />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
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
  border: string;
} {
  if (theme === 'dark') {
    return {
      background: '#1F2937',
      text: '#F9FAFB',
      border: '#374151',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
  };
}
