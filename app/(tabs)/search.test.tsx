import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TabSearchScreen from './search';
import { useTheme } from '@/components/ThemeProvider';
import { searchFlights } from '@/src/lib/flightService';
import { Alert } from 'react-native';
import { useTranslations } from 'next-intl';

// Mock external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('@/src/lib/flightService', () => ({
  searchFlights: jest.fn(),
}));
jest.mock('@/components/flight-search-form', () => ({
  FlightSearchForm: jest.fn(({ onSearch, isLoading }) => (
    <mock-flight-search-form onSearch={onSearch} isLoading={isLoading}>
      <button onPress={() => onSearch('JL123', '2024-07-20')}>Search</button>
      {isLoading && <text>Form Loading...</text>}
    </mock-flight-search-form>
  )),
}));
jest.mock('@/components/flight-list', () => ({
  FlightList: jest.fn(({ flights, isLoading, error, onSelectFlight }) => (
    <mock-flight-list flights={flights} isLoading={isLoading} error={error} onSelectFlight={onSelectFlight}>
      {flights.map((f) => (
        <button key={f.flightIata} onPress={() => onSelectFlight(f)}>
          {f.flightIata}
        </button>
      ))}
      {isLoading && <text>List Loading...</text>}
      {error && <text>Error: {error}</text>}
      {flights.length === 0 && !isLoading && !error && <text>No results</text>}
    </mock-flight-list>
  )),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: jest.fn(),
    },
  };
});
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => (key, params) => {
    let message = `${namespace}.${key}`;
    if (params) {
      message += ` ${JSON.stringify(params)}`;
    }
    return message;
  }),
}));

describe('TabSearchScreen', () => {
  const mockFlight = {
    flightIata: 'JL123',
    airlineName: 'JAL',
    flightDate: '2024-07-20',
    status: 'scheduled',
    departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00Z' },
    arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00Z' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (searchFlights as jest.Mock).mockResolvedValue([mockFlight]);
  });

  it('renders initial message when no search has been performed', () => {
    render(<TabSearchScreen />);
    expect(screen.getByText('search.title')).toBeVisible();
    expect(screen.getByText('search.description')).toBeVisible();
    expect(screen.queryByText('JL123')).toBeNull();
  });

  it('calls searchFlights and displays results', async () => {
    render(<TabSearchScreen />);
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(searchFlights).toHaveBeenCalledWith('JL123', '2024-07-20');
      expect(screen.getByText('JL123')).toBeVisible();
    });
  });

  it('displays "no results" message when search returns empty array', async () => {
    (searchFlights as jest.Mock).mockResolvedValueOnce([]);
    render(<TabSearchScreen />);
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      // The FlightList component is mocked to display "Error: {error}" when error prop is set.
      // When searchResults is empty and not loading, the error is set to 'flight.list.noResults'.
      expect(screen.getByText('Error: search.flight.list.noResults')).toBeVisible();
    });
  });

  it('displays error message when search fails', async () => {
    (searchFlights as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<TabSearchScreen />);
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Error: search.flight.list.error.generic')).toBeVisible();
    });
  });

  it('calls onSelectFlight and shows an alert when a flight is selected', async () => {
    render(<TabSearchScreen />);
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('JL123')).toBeVisible();
    });

    fireEvent.press(screen.getByText('JL123')); // Simulate selecting the flight

    expect(Alert.alert).toHaveBeenCalledWith(
      'search.flightSelected.title',
      'search.flightSelected.message {"flightNumber":"JL123","airline":"JAL"}',
      [{ text: 'common.ok' }]
    );
  });

  it('shows loading indicator during search', async () => {
    (searchFlights as jest.Mock).mockReturnValueOnce(new Promise(() => {})); // Never resolve
    render(<TabSearchScreen />);
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('List Loading...')).toBeVisible();
    });
  });
});
