import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from './ThemeProvider';
import type { FlightInfo } from '@/types/flight';
import { STATUS_COLORS, type FlightStatusType } from '@/types/flight';
import { type ColorScheme } from '@/types/theme';
import { getStatusKey } from '@/lib/flightService';
import { formatInTimeZone } from 'date-fns-tz'; // Import formatInTimeZone

interface FlightCardProps {
  flight: FlightInfo;
  isTracked: boolean;
  onToggleTrack: () => void;
}

function formatTime(dateStr: string | null, timezone: string | undefined, locale: string): string {
  if (!dateStr || !timezone) return '--:--';
  try {
    const date = new Date(dateStr);
    // Use formatInTimeZone to display time in the specified timezone
    return formatInTimeZone(date, timezone, 'HH:mm', { locale: new Date(date).toLocaleDateString(locale) });
  } catch (error: unknown) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
}

export function FlightCard({ flight, isTracked, onToggleTrack }: FlightCardProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const statusColor = STATUS_COLORS[flight.status] ?? '#6B7280';
  const t = useTranslations('flight'); // Use useTranslations hook
  const locale = useLocale(); // Get current locale

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {/* Header: Flight number + Status */}
      <View style={styles.header}>
        <View style={styles.flightId}>
          <Text style={[styles.airline, { color: colors.secondaryText }]}>
            {flight.airlineName}
          </Text>
          <Text style={[styles.flightNumber, { color: colors.text }]}>
            {flight.flightIata}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(getStatusKey(flight.status))}
          </Text>
        </View>
      </View>

      {/* Route: DEP → ARR */}
      <View style={styles.route}>
        <View style={styles.airport}>
          <Text style={[styles.iata, { color: colors.text }]}>{flight.departure.iata}</Text>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(
              flight.departure.actual ?? flight.departure.estimated ?? flight.departure.scheduled,
              flight.departure.timezone, // Pass timezone directly
              locale
            )}
          </Text>
          {flight.departure.terminal ? (
            <Text style={[styles.detail, { color: colors.secondaryText }]}>
              {t('terminal')} {flight.departure.terminal}
            </Text>
          ) : null}
          {flight.departure.gate ? (
            <Text style={[styles.detail, { color: colors.secondaryText }]}>
              {t('gate')} {flight.departure.gate}
            </Text>
          ) : null}
        </View>

        <View style={styles.routeMiddle}>
          <MaterialCommunityIcons name="airplane" size={20} color={statusColor} />
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.airport, styles.airportRight]}>
          <Text style={[styles.iata, { color: colors.text }]}>{flight.arrival.iata}</Text>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(
              flight.arrival.actual ?? flight.arrival.estimated ?? flight.arrival.scheduled,
              flight.arrival.timezone, // Pass timezone directly
              locale
            )}
          </Text>
          {flight.arrival.terminal ? (
            <Text style={[styles.detail, { color: colors.secondaryText }]}>
              {t('terminal')} {flight.arrival.terminal}
            </Text>
          ) : null}
          {flight.arrival.gate ? (
            <Text style={[styles.detail, { color: colors.secondaryText }]}>
              {t('gate')} {flight.arrival.gate}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Delay info */}
      {flight.departure.delay && flight.departure.delay > 0 ? (
        <View style={[styles.delayBar, { backgroundColor: '#F59E0B20' }]}>
          <MaterialCommunityIcons name="clock-alert-outline" size={14} color="#F59E0B" />
          <Text style={styles.delayText}>
            {t('delay', { minutes: String(flight.departure.delay) })}
          </Text>
        </View>
      ) : null}

      {/* Track button */}
      <Pressable
        style={[
          styles.trackButton,
          { backgroundColor: isTracked ? colors.trackActiveBg : colors.trackBg },
        ]}
        onPress={onToggleTrack}
        accessibilityLabel={isTracked ? t('untrack') : t('track')}
      >
        <MaterialCommunityIcons
          name={isTracked ? 'bell-off-outline' : 'bell-plus-outline'}
          size={16}
          color={isTracked ? colors.secondaryText : '#22D3EE'}
        />
        <Text
          style={[
            styles.trackButtonText,
            { color: isTracked ? colors.secondaryText : '#22D3EE' },
          ]}
        >
          {isTracked ? t('untrack') : t('track')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  flightId: {
    flex: 1,
  },
  airline: {
    fontSize: 12,
    marginBottom: 2,
  },
  flightNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  route: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  airport: {
    flex: 1,
  },
  airportRight: {
    alignItems: 'flex-end',
  },
  iata: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  detail: {
    fontSize: 11,
  },
  routeMiddle: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  routeLine: {
    width: 40,
    height: 1,
    marginTop: 4,
  },
  delayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  delayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

function getColors(theme: ColorScheme): {
  cardBg: string;
  border: string;
  text: string;
  secondaryText: string;
  trackBg: string;
  trackActiveBg: string;
} {
  if (theme === 'dark') {
    return {
      cardBg: '#1F2937',
      border: '#374151',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      trackBg: '#22D3EE15',
      trackActiveBg: '#37415180',
    };
  }
  return {
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1F2937',
    secondaryText: '#6B7280',
    trackBg: '#22D3EE10',
    trackActiveBg: '#F3F4F6',
  };
}



