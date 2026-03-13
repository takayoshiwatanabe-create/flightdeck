import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { FlightCard } from '@/components/FlightCard';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { type FlightInfo } from '@/types/flight';
import { useTrackedFlights } from '@/hooks/useTrackedFlights';
import { useTranslations } from 'next-intl';

interface FlightListProps {
  flights: FlightInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectFlight: (flight: FlightInfo) => void;
}

export function FlightList({ flights, isLoading, error, onSelectFlight }: FlightListProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { addFlight, removeFlight, isFlightTracked } = useTrackedFlights();
  const t = useTranslations('flight.list');

  const handleToggleTrack = (flightIata: string, flight: FlightInfo): void => {
    if (isFlightTracked(flightIata)) {
      void removeFlight(flightIata);
    } else {
      void addFlight(flight.flightIata, flight.flightDate); // Pass flightIata and flightDate
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
      </View>
    );
  }

  if (flights.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.noResultsText, { color: colors.secondaryText }]}>{t('noResults')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={flights}
      keyExtractor={(item) => item.flightIata}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelectFlight(item)}>
          <FlightCard
            flight={item}
            isTracked={isFlightTracked(item.flightIata)}
            onToggleTrack={(flightIata) => handleToggleTrack(flightIata, item)}
          />
        </Pressable>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
});

function getColors(theme: ColorScheme): {
  secondaryText: string;
  errorText: string;
} {
  if (theme === 'dark') {
    return {
      secondaryText: '#9CA3AF',
      errorText: '#EF4444',
    };
  }
  return {
    secondaryText: '#6B7280',
    errorText: '#EF4444',
  };
}
