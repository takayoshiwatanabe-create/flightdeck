import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { t, isRTL } from '@/i18n'; // Replaced by next-intl
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { type FlightInfo, STATUS_COLORS } from '@/types/flight';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslations } from 'next-intl'; // Import useTranslations
import { useLocale } from 'next-intl'; // Import useLocale for RTL

interface FlightListProps {
  flights: FlightInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectFlight: (flight: FlightInfo) => void;
}

export function FlightList({ flights, isLoading, error, onSelectFlight }: FlightListProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  // Use next-intl hooks for translations and locale
  const t = useTranslations(['flight', 'home']); // Specify namespaces
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  if (isLoading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>{t('list.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Text style={[styles.errorDetailText, { color: colors.secondaryText }]}>{t('list.error.generic')}</Text>
      </View>
    );
  }

  if (flights.length === 0) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="airplane-off" size={48} color={colors.secondaryText} />
        <Text style={[styles.noResultsText, { color: colors.secondaryText }]}>{t('list.noResults')}</Text>
      </View>
    );
  }

  const renderFlightItem = ({ item }: { item: FlightInfo }): JSX.Element => {
    const statusColor = STATUS_COLORS[item.status] || colors.secondaryText;
    // Use Intl.DateTimeFormat().resolvedOptions().timeZone for client's local timezone
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const departureTime = formatInTimeZone(parseISO(item.departure.scheduled), clientTimeZone, 'HH:mm');
    const arrivalTime = formatInTimeZone(parseISO(item.arrival.scheduled), clientTimeZone, 'HH:mm');

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <Pressable
          style={({ pressed }) => [
            styles.flightItem,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => onSelectFlight(item)}
          accessibilityLabel={`${item.airlineName} ${item.flightIata} from ${item.departure.airport} to ${item.arrival.airport}`}
        >
          <View style={[styles.headerRow, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.airlineName, { color: colors.text }]} numberOfLines={1}>
              {item.airlineName}
            </Text>
            <Text style={[styles.flightNumber, { color: colors.primary }]} numberOfLines={1}>
              {item.flightIata}
            </Text>
          </View>

          <View style={[styles.statusRow, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor, marginRight: direction === 'rtl' ? 0 : 8, marginLeft: direction === 'rtl' ? 8 : 0 }]} />
            <Text style={[styles.statusText, { color: statusColor, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
              {t(`status.${item.status}`)}
            </Text>
          </View>

          <View style={[styles.detailsRow, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
            <View style={[styles.airportInfo, { alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.timeText, { color: colors.text }]}>{departureTime}</Text>
              <Text style={[styles.airportCode, { color: colors.secondaryText }]}>{item.departure.iata}</Text>
              <Text style={[styles.airportName, { color: colors.secondaryText, textAlign: direction === 'rtl' ? 'right' : 'left' }]} numberOfLines={1}>
                {item.departure.airport}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={direction === 'rtl' ? 'airplane-landing' : 'airplane-takeoff'} // Icon direction adjusted for RTL
              size={24}
              color={colors.icon}
              style={styles.arrowIcon}
            />

            <View style={[styles.airportInfo, { alignItems: direction === 'rtl' ? 'flex-start' : 'flex-end' }]}>
              <Text style={[styles.timeText, { color: colors.text }]}>{arrivalTime}</Text>
              <Text style={[styles.airportCode, { color: colors.secondaryText }]}>{item.arrival.iata}</Text>
              <Text style={[styles.airportName, { color: colors.secondaryText, textAlign: direction === 'rtl' ? 'left' : 'right' }]} numberOfLines={1}>
                {item.arrival.airport}
              </Text>
            </View>
          </View>
          {item.departure.delay && item.departure.delay > 0 && (
            <View style={[styles.delayRow, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={16} color={STATUS_COLORS.delayed} style={{ marginRight: direction === 'rtl' ? 0 : 5, marginLeft: direction === 'rtl' ? 5 : 0 }} />
              <Text style={[styles.delayText, { color: STATUS_COLORS.delayed, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
                {t('delay', { minutes: item.departure.delay.toString() })}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={flights}
      renderItem={renderFlightItem}
      keyExtractor={(item) => item.flightIata + item.flightDate + item.flightNumber}
      contentContainerStyle={styles.listContentContainer}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
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
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorDetailText: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  flightItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  headerRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginEnd: 10,
  },
  flightNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    // marginRight: 8, // Adjusted inline for RTL
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  airportInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  airportCode: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  airportName: {
    fontSize: 12,
    marginTop: 2,
  },
  arrowIcon: {
    marginHorizontal: 15,
  },
  delayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light gray for separator
  },
  delayText: {
    fontSize: 14,
    fontWeight: '500',
    // marginLeft: 5, // Adjusted inline for RTL
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  primary: string;
  cardBackground: string;
  cardBorder: string;
  icon: string;
  error: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      primary: '#22D3EE', // Cyan
      cardBackground: '#1F2937', // Dark Gray
      cardBorder: '#374151',
      icon: '#D1D5DB',
      error: '#EF4444',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    primary: '#22D3EE', // Cyan
    cardBackground: '#FFFFFF',
    cardBorder: '#E5E7EB',
    icon: '#6B7280',
    error: '#EF4444',
  };
}
