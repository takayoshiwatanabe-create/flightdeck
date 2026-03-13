import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { FlightCard } from '@/components/FlightCard';
import { AdBanner } from '@/components/ads/AdBanner';
import { type ColorScheme } from '@/types/theme';
import { useTrackedFlights } from '@/hooks/useTrackedFlights';

export default function TabHomeScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const {
    trackedFlights,
    flightDetails,
    isLoading,
    removeFlight,
    refreshDetails,
  } = useTrackedFlights();
  const t = useTranslations('home');

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await refreshDetails();
    setRefreshing(false);
  }, [refreshDetails]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {trackedFlights.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="airplane-clock" size={64} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('noTrackedFlights')}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.secondaryText }]}>
            {t('addFlightHint')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trackedFlights}
          keyExtractor={(item) => item.flightIata}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor="#22D3EE"
            />
          }
          ListHeaderComponent={
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('trackedFlights')}
            </Text>
          }
          renderItem={({ item }) => {
            const flight = flightDetails.get(item.flightIata);
            if (!flight) {
              return (
                <View style={[styles.loadingCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
                    {item.flightIata}
                  </Text>
                  <ActivityIndicator size="small" color="#22D3EE" />
                </View>
              );
            }
            return (
              <FlightCard
                flight={flight}
                isTracked={true}
                onToggleTrack={() => void removeFlight(item.flightIata)}
              />
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <View style={styles.adContainer}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 15,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  cardBg: string;
  border: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      cardBg: '#1F2937',
      border: '#374151',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
  };
}
