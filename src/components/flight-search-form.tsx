import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { format } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl'; // Ensure useLocale is imported
// Removed useLocale from here as it's already imported above.

interface FlightSearchFormProps {
  onSearch: (flightNumber: string, flightDate: string) => void;
  isLoading: boolean;
}

export function FlightSearchForm({ onSearch, isLoading }: FlightSearchFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [flightDate, setFlightDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const t = useTranslations('search');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const handleSearch = (): void => {
    if (flightNumber.trim()) {
      onSearch(flightNumber.trim(), flightDate);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border, flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.inputText,
            borderColor: colors.inputBorder,
            textAlign: direction === 'rtl' ? 'right' : 'left',
            flex: 1,
            marginEnd: isRTL ? 0 : 10,
            marginStart: isRTL ? 10 : 0,
          },
        ]}
        placeholder={t('form.flightNumberPlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={flightNumber}
        onChangeText={setFlightNumber}
        keyboardType="default"
        autoCapitalize="characters"
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        editable={!isLoading}
        accessibilityLabel={t('form.flightNumberPlaceholder')}
      />
      <TextInput
        style={[
          styles.dateInput,
          {
            backgroundColor: colors.inputBackground,
            color: colors.inputText,
            borderColor: colors.inputBorder,
            textAlign: direction === 'rtl' ? 'right' : 'left',
            marginEnd: isRTL ? 10 : 0,
            marginStart: isRTL ? 0 : 10,
          },
        ]}
        placeholder={t('form.datePlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={flightDate}
        onChangeText={setFlightDate}
        keyboardType="numbers-and-punctuation"
        editable={!isLoading}
        accessibilityLabel={t('form.datePlaceholder')}
      />
      <Pressable
        style={({ pressed }) => [
          styles.searchButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed || isLoading ? 0.7 : 1,
            marginStart: isRTL ? 0 : 10,
            marginEnd: isRTL ? 10 : 0,
          },
        ]}
        onPress={handleSearch}
        disabled={isLoading}
        accessibilityLabel={t('form.searchButton')}
      >
        {isLoading ? (
          <MaterialCommunityIcons name="loading" size={24} color={colors.buttonText} style={styles.loadingIcon} />
        ) : (
          <MaterialCommunityIcons name="magnify" size={24} color={colors.buttonText} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  dateInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    width: 120,
  },
  searchButton: {
    height: 48,
    width: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  primary: string;
  buttonText: string;
  border: string;
} {
  if (theme === 'dark') {
    return {
      background: '#1F2937',
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      primary: '#22D3EE',
      buttonText: '#1F2937',
      border: '#374151',
    };
  }
  return {
    background: '#FFFFFF',
    inputBackground: '#F3F4F6',
    inputText: '#1F2937',
    inputPlaceholder: '#6B7280',
    inputBorder: '#E5E7EB',
    primary: '#22D3EE',
    buttonText: '#FFFFFF',
    border: '#E5E7EB',
  };
}

