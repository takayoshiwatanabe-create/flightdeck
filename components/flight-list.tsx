import React from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@/i18n';
import { useTheme } from './ThemeProvider';
import { FlightCard } from './FlightCard';
import { type FlightInfo } from '@/types/flight';
import { type ColorScheme } from '@/types/theme';
import { useTrackedFlights } from '@/hooks/useTrackedFlights'; // Import the hook

interface FlightListProps {
  flights: FlightInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectFlight: (flight: FlightInfo) => void;
}

export function FlightList({ flights, isLoading, error, onSelectFlight }: FlightListProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { addFlight, removeFlight, isTracked } = useTrackedFlights(); // Use the hook

  const handleToggleTrack = async (flight: FlightInfo): Promise<void> => {
    if (isTracked(flight.flightIata)) {
      await removeFlight(flight.flightIata);
    } else {
      await addFlight(flight.flightIata, flight.flightDate);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>{t('flight.list.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (flights.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="magnify-remove-outline" size={64} color={colors.secondaryText} />
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{t('flight.list.noResults')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={flights}
      keyExtractor={(item) => item.flightIata}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <FlightCard
          flight={item}
          isTracked={isTracked(item.flightIata)}
          onToggleTrack={() => void handleToggleTrack(item)}
        />
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
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  error: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      error: '#EF4444',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    error: '#EF4444',
  };
}

