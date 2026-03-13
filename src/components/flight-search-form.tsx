import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t, isRTL } from '@/i18n';
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { format } from 'date-fns';

interface FlightSearchFormProps {
  onSearch: (flightNumber: string, flightDate: string) => void;
  isLoading: boolean;
}

export function FlightSearchForm({ onSearch, isLoading }: FlightSearchFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [flightDate, setFlightDate] = useState<string>(format(new Date(), 'yyyy-MM-dd')); // Default to today
  const direction = isRTL() ? 'rtl' : 'ltr';

  const handleSearch = (): void => {
    if (flightNumber.trim()) {
      onSearch(flightNumber.trim(), flightDate);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.inputText,
            borderColor: colors.inputBorder,
            textAlign: direction === 'rtl' ? 'right' : 'left',
            flex: 1, // Allow input to take available space
            marginEnd: direction === 'rtl' ? 0 : 10, // Add margin based on direction
            marginStart: direction === 'rtl' ? 10 : 0,
          },
        ]}
        placeholder={t('search.form.flightNumberPlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={flightNumber}
        onChangeText={setFlightNumber}
        keyboardType="default"
        autoCapitalize="characters"
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        editable={!isLoading}
        accessibilityLabel={t('search.form.flightNumberPlaceholder')}
      />
      {/* Date input is simplified for now; a proper date picker would be used in a full app */}
      <TextInput
        style={[
          styles.dateInput,
          {
            backgroundColor: colors.inputBackground,
            color: colors.inputText,
            borderColor: colors.inputBorder,
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        ]}
        placeholder={t('search.form.flightDatePlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={flightDate}
        onChangeText={setFlightDate}
        keyboardType="numbers-and-punctuation"
        editable={!isLoading}
        accessibilityLabel={t('search.form.flightDatePlaceholder')}
      />
      <Pressable
        style={({ pressed }) => [
          styles.searchButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed || isLoading ? 0.7 : 1,
            marginStart: direction === 'rtl' ? 0 : 10, // Add margin based on direction
            marginEnd: direction === 'rtl' ? 10 : 0,
          },
        ]}
        onPress={handleSearch}
        disabled={isLoading}
        accessibilityLabel={t('search.form.searchButton')}
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
    // borderBottomColor handled by getColors
    flexDirection: 'row',
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
    width: 120, // Fixed width for date input
    marginHorizontal: 10,
  },
  searchButton: {
    height: 48,
    width: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    // Add any specific styling for the loading icon if needed
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
      background: '#1F2937', // Dark Gray
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      primary: '#22D3EE', // Cyan
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
    primary: '#22D3EE', // Cyan
    buttonText: '#FFFFFF',
    border: '#E5E7EB',
  };
}
