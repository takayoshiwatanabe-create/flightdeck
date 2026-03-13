import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations } from 'next-intl';
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { format } from 'date-fns';

interface FlightSearchFormProps {
  onSearch: (flightNumber: string, flightDate: string) => Promise<void>;
  isLoading: boolean;
}

export function FlightSearchForm({ onSearch, isLoading }: FlightSearchFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [flightDate, setFlightDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('search.form'); // Use useTranslations hook

  const handleSearch = async (): Promise<void> => {
    setError(null);
    if (!flightNumber.trim()) {
      setError(t('error.emptyFlightNumber'));
      return;
    }
    // Basic date format validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate)) {
      setError(t('error.invalidDate'));
      return;
    }

    await onSearch(flightNumber.trim(), flightDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
        placeholder={t('flightNumberPlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={flightNumber}
        onChangeText={setFlightNumber}
        autoCapitalize="characters"
        editable={!isLoading}
        accessibilityLabel={t('flightNumberPlaceholder')}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
        placeholder={t('datePlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={flightDate}
        onChangeText={setFlightDate}
        keyboardType="numeric"
        editable={!isLoading}
        accessibilityLabel={t('datePlaceholder')}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      <Pressable
        style={[styles.button, { backgroundColor: colors.buttonBackground }]}
        onPress={() => void handleSearch()}
        disabled={isLoading}
        accessibilityLabel={t('searchButton')}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.buttonText} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {t('searchButton')}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  buttonBackground: string;
  buttonText: string;
  error: string;
} {
  if (theme === 'dark') {
    return {
      background: '#1F2937',
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      buttonBackground: '#22D3EE', // Cyan
      buttonText: '#1F2937',
      error: '#EF4444', // Red
    };
  }
  return {
    background: '#FFFFFF',
    inputBackground: '#F9FAFB',
    inputText: '#1F2937',
    inputPlaceholder: '#6B7280',
    inputBorder: '#E5E7EB',
    buttonBackground: '#22D3EE', // Cyan
    buttonText: '#FFFFFF',
    error: '#EF4444', // Red
    };
}
