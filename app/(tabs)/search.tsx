import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { FlightSearchForm } from '@/components/flight-search-form';
import { FlightList } from '@/components/flight-list';
import { searchFlights } from '@/src/lib/flightService';
import { type FlightInfo } from '@/types/flight';
import { useRouter } from 'expo-router';

export default function TabSearchScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [searchResults, setSearchResults] = useState<FlightInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('search');
  const tCommon = useTranslations('common');

  const handleSearch = async (flightNumber: string, flightDate: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const flights: FlightInfo[] = await searchFlights(flightNumber, flightDate);
      setSearchResults(flights);
      if (flights.length === 0) {
        setError(t('flight.list.noResults'));
      }
    } catch (e: unknown) {
      console.error('Flight search error:', e);
      setError(t('flight.list.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFlight = (flight: FlightInfo): void => {
    // TODO: Implement navigation to a detailed flight view or tracking logic
    Alert.alert(
      t('flightSelected.title'),
      t('flightSelected.message', { flightNumber: flight.flightIata, airline: flight.airlineName }),
      [{ text: tCommon('ok') }]
    );
    // Example: router.push(`/flight-details/${flight.flightIata}?date=${flight.flightDate}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlightSearchForm onSearch={handleSearch} isLoading={isLoading} />
      <View style={styles.resultsContainer}>
        {searchResults.length === 0 && !isLoading && !error ? (
          <View style={styles.initialMessageContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{t('title')}</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{t('description')}</Text>
          </View>
        ) : (
          <FlightList flights={searchResults} isLoading={isLoading} error={error} onSelectFlight={handleSelectFlight} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
  },
  initialMessageContainer: {
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

