import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FlightCard } from './FlightCard';
import { useTheme } from './ThemeProvider';
import { useLocale } from 'next-intl';
import { formatInTimeZone } from 'date-fns-tz';

// Mock external dependencies
jest.mock('./ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `flight.${key}`),
  useLocale: jest.fn(() => 'en'),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn((date, timezone, formatStr) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }),
}));

describe('FlightCard', () => {
  const mockFlight = {
    flightIata: 'JL123',
    airlineName: 'JAL',
    flightDate: '2024-07-20',
    status: 'scheduled' as const,
    departure: {
      iata: 'HND',
      timezone: 'Asia/Tokyo',
      scheduled: '2024-07-20T10:00:00Z',
      estimated: '2024-07-20T10:05:00Z',
      actual: null,
      terminal: '1',
      gate: 'A1',
      delay: 5,
    },
    arrival: {
      iata: 'ITM',
      timezone: 'Asia/Tokyo',
      scheduled: '2024-07-20T11:00:00Z',
      estimated: '2024-07-20T11:10:00Z',
      actual: null,
      terminal: '2',
      gate: 'B2',
      delay: null,
    },
  };

  const mockOnToggleTrack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (useLocale as jest.Mock).mockReturnValue('en');
    (formatInTimeZone as jest.Mock).mockImplementation((date, timezone, formatStr) => {
      const d = new Date(date);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    });
  });

  it('renders flight information correctly', () => {
    render(<FlightCard flight={mockFlight} isTracked={false} onToggleTrack={mockOnToggleTrack} />);

    expect(screen.getByText('JAL')).toBeVisible();
    expect(screen.getByText('JL123')).toBeVisible();
    expect(screen.getByText('flight.scheduled')).toBeVisible();
    expect(screen.getByText('HND')).toBeVisible();
    expect(screen.getByText('ITM')).toBeVisible();
    expect(screen.getByText('10:00')).toBeVisible(); // Uses scheduled time if actual/estimated are null
    expect(screen.getByText('11:00')).toBeVisible();
    expect(screen.getByText('flight.terminal 1')).toBeVisible();
    expect(screen.getByText('flight.gate A1')).toBeVisible();
    expect(screen.getByText('flight.terminal 2')).toBeVisible();
    expect(screen.getByText('flight.gate B2')).toBeVisible();
    expect(screen.getByText('flight.delay')).toBeVisible();
    expect(screen.getByText('flight.track')).toBeVisible();
  });

  it('displays estimated time if actual is null and estimated is present', () => {
    const flightWithEstimated = {
      ...mockFlight,
      departure: { ...mockFlight.departure, actual: null, estimated: '2024-07-20T10:15:00Z' },
    };
    render(<FlightCard flight={flightWithEstimated} isTracked={false} onToggleTrack={mockOnToggleTrack} />);
    expect(screen.getByText('10:15')).toBeVisible();
  });

  it('displays actual time if present', () => {
    const flightWithActual = {
      ...mockFlight,
      departure: { ...mockFlight.departure, actual: '2024-07-20T10:20:00Z', estimated: '2024-07-20T10:15:00Z' },
    };
    render(<FlightCard flight={flightWithActual} isTracked={false} onToggleTrack={mockOnToggleTrack} />);
    expect(screen.getByText('10:20')).toBeVisible();
  });

  it('calls onToggleTrack when track button is pressed', () => {
    render(<FlightCard flight={mockFlight} isTracked={false} onToggleTrack={mockOnToggleTrack} />);
    fireEvent.press(screen.getByLabelText('flight.track'));
    expect(mockOnToggleTrack).toHaveBeenCalled();
  });

  it('shows "Untrack" button when flight is tracked', () => {
    render(<FlightCard flight={mockFlight} isTracked={true} onToggleTrack={mockOnToggleTrack} />);
    expect(screen.getByText('flight.untrack')).toBeVisible();
    fireEvent.press(screen.getByLabelText('flight.untrack'));
    expect(mockOnToggleTrack).toHaveBeenCalled();
  });

  it('does not display delay bar if delay is 0 or null', () => {
    const flightNoDelay = {
      ...mockFlight,
      departure: { ...mockFlight.departure, delay: 0 },
    };
    render(<FlightCard flight={flightNoDelay} isTracked={false} onToggleTrack={mockOnToggleTrack} />);
    expect(screen.queryByText('flight.delay')).toBeNull();
  });

  it('handles missing terminal/gate information gracefully', () => {
    const flightNoDetails = {
      ...mockFlight,
      departure: { ...mockFlight.departure, terminal: null, gate: null },
      arrival: { ...mockFlight.arrival, terminal: null, gate: null },
    };
    render(<FlightCard flight={flightNoDetails} isTracked={false} onToggleTrack={mockOnToggleTrack} />);
    expect(screen.queryByText('flight.terminal')).toBeNull();
    expect(screen.queryByText('flight.gate')).toBeNull();
  });

  it('formats time using the correct timezone and locale', () => {
    render(<FlightCard flight={mockFlight} isTracked={false} onToggleTrack={mockOnToggleTrack} />);
    expect(formatInTimeZone).toHaveBeenCalledWith(
      new Date('2024-07-20T10:00:00Z'),
      'Asia/Tokyo',
      'HH:mm',
      expect.any(Object)
    );
    expect(formatInTimeZone).toHaveBeenCalledWith(
      new Date('2024-07-20T11:00:00Z'),
      'Asia/Tokyo',
      'HH:mm',
      expect.any(Object)
    );
  });
});

