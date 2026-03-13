import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { type FlightInfo, STATUS_COLORS } from '@/types/flight';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

interface FlightCardProps {
  flight: FlightInfo;
  isTracked: boolean;
  onToggleTrack: (flightIata: string) => void;
}

export function FlightCard({ flight, isTracked, onToggleTrack }: FlightCardProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('flight');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const getStatusColor = (status: FlightInfo['status']): string => {
    return STATUS_COLORS[status] || colors.secondaryText;
  };

  const formatTime = (isoString: string | null): string => {
    if (!isoString) return '--:--';
    try {
      // Convert UTC string to local time for display
      const date = parseISO(isoString);
      const zonedDate = utcToZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
      return format(zonedDate, 'HH:mm');
    } catch (e: unknown) {
      console.error('Error formatting time:', e);
      return '--:--';
    }
  };

  const getStatusText = (status: FlightInfo['status'], delay: number | null): string => {
    if (status === 'delayed' && delay) {
      return t('delay', { minutes: delay });
    }
    return t(`status.${status}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(flight.status), marginStart: isRTL ? 12 : 0, marginEnd: isRTL ? 0 : 12 }]} />
      <View style={[styles.content, { alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.flightNumber, { color: colors.text }]}>
          {flight.airlineIata} {flight.flightNumber}
        </Text>
        <Text style={[styles.airlineName, { color: colors.secondaryText }]}>
          {flight.airlineName}
        </Text>
        <Text style={[styles.statusText, { color: getStatusColor(flight.status) }]}>
          {getStatusText(flight.status, flight.departure.delay)}
        </Text>
        <View style={[styles.timeInfo, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(flight.departure.estimated)}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={colors.secondaryText} style={isRTL ? { transform: [{ scaleX: -1 }] } : {}} />
          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(flight.arrival.estimated)}
          </Text>
        </View>
        <View style={[styles.airportInfo, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.airportText, { color: colors.secondaryText }]}>
            {flight.departure.iata}
            {flight.departure.terminal ? ` (${flight.departure.terminal})` : ''}
            {flight.departure.gate ? ` ${t('gate')} ${flight.departure.gate}` : ''}
          </Text>
          <Text style={[styles.airportText, { color: colors.secondaryText }]}>
            {flight.arrival.iata}
            {flight.arrival.terminal ? ` (${flight.arrival.terminal})` : ''}
            {flight.arrival.gate ? ` ${t('gate')} ${flight.arrival.gate}` : ''}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => onToggleTrack(flight.flightIata)}
        style={({ pressed }) => [
          styles.trackButton,
          { opacity: pressed ? 0.7 : 1 },
          { backgroundColor: isTracked ? colors.untrackButtonBg : colors.trackButtonBg },
          { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
        ]}
        accessibilityLabel={isTracked ? t('untrack') : t('track')}
      >
        <MaterialCommunityIcons
          name={isTracked ? 'bookmark-remove' : 'bookmark-plus'}
          size={24}
          color={colors.buttonText}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 16,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  flightNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  airlineName: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInfo: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
  },
  airportInfo: {
    gap: 8,
  },
  airportText: {
    fontSize: 12,
  },
  trackButton: {
    padding: 10,
    borderRadius: 8,
  },
});

function getColors(theme: ColorScheme): {
  cardBg: string;
  border: string;
  text: string;
  secondaryText: string;
  trackButtonBg: string;
  untrackButtonBg: string;
  buttonText: string;
} {
  if (theme === 'dark') {
    return {
      cardBg: '#1F2937',
      border: '#374151',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      trackButtonBg: '#22D3EE',
      untrackButtonBg: '#EF4444', // Red for untrack
      buttonText: '#1F2937',
    };
  }
  return {
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1F2937',
    secondaryText: '#6B7280',
    trackButtonBg: '#22D3EE',
    untrackButtonBg: '#EF4444', // Red for untrack
    buttonText: '#FFFFFF',
  };
}
