import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import TabHomeScreen from './index';
import { useTheme } from '@/components/ThemeProvider';
import { useTrackedFlights } from '@/src/hooks/useTrackedFlights';
import { AdBanner } from '@/components/ads/AdBanner';
import { useTranslations } from 'next-intl';
import { RefreshControl } from 'react-native'; // Import RefreshControl

// Mock external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('@/src/hooks/useTrackedFlights', () => ({
  useTrackedFlights: jest.fn(),
}));
jest.mock('@/components/ads/AdBanner', () => ({
  AdBanner: jest.fn(() => <mock-ad-banner />),
}));
jest.mock('@/components/FlightCard', () => ({
  FlightCard: jest.fn(({ flight, isTracked, onToggleTrack }) => (
    <mock-flight-card
      testID={`flight-card-${flight.flightIata}`}
      flight={flight}
      isTracked={isTracked}
      onToggleTrack={onToggleTrack}
    >
      <text>{flight.flightIata}</text>
      <text>{flight.airlineName}</text>
      <button onPress={onToggleTrack}>Toggle Track</button>
    </mock-flight-card>
  )),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => (key, params) => {
    let message = `${namespace}.${key}`;
    if (params) {
      message += ` ${JSON.stringify(params)}`;
    }
    return message;
  }),
}));

describe('TabHomeScreen', () => {
  const mockFlight1 = {
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
    (useTrackedFlights as jest.Mock).mockReturnValue({
      trackedFlights: [],
      flightDetails: new Map(),
      isLoading: false,
      removeFlight: jest.fn(),
      refreshDetails: jest.fn(),
    });
  });

  it('renders loading state initially', () => {
    (useTrackedFlights as jest.Mock).mockReturnValueOnce({
      trackedFlights: [],
      flightDetails: new Map(),
      isLoading: true,
      removeFlight: jest.fn(),
      refreshDetails: jest.fn(),
    });
    render(<TabHomeScreen />);
    expect(screen.getByA11yLabel('Loading')).toBeVisible();
  });

  it('renders empty state when no flights are tracked', () => {
    render(<TabHomeScreen />);
    expect(screen.getByText('home.noTrackedFlights')).toBeVisible();
    expect(screen.getByText('home.addFlightHint')).toBeVisible();
    expect(screen.getByText('MaterialCommunityIcons')).toBeVisible(); // Check for icon
  });

  it('renders tracked flights and AdBanner', async () => {
    (useTrackedFlights as jest.Mock).mockReturnValue({
      trackedFlights: [{ flightIata: 'JL123', flightDate: '2024-07-20' }],
      flightDetails: new Map([['JL123', mockFlight1]]),
      isLoading: false,
      removeFlight: jest.fn(),
      refreshDetails: jest.fn(),
    });
    render(<TabHomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('home.trackedFlights')).toBeVisible();
      expect(screen.getByText('JL123')).toBeVisible();
      expect(screen.getByText('JAL')).toBeVisible();
      expect(screen.getByTestId('flight-card-JL123')).toBeVisible();
      expect(screen.getByText('mock-ad-banner')).toBeVisible();
    });
  });

  it('calls removeFlight when onToggleTrack is called on a FlightCard', async () => {
    const mockRemoveFlight = jest.fn();
    (useTrackedFlights as jest.Mock).mockReturnValue({
      trackedFlights: [{ flightIata: 'JL123', flightDate: '2024-07-20' }],
      flightDetails: new Map([['JL123', mockFlight1]]),
      isLoading: false,
      removeFlight: mockRemoveFlight,
      refreshDetails: jest.fn(),
    });
    render(<TabHomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('flight-card-JL123')).toBeVisible();
    });

    fireEvent.press(screen.getByText('Toggle Track')); // Trigger the button inside mock FlightCard
    expect(mockRemoveFlight).toHaveBeenCalledWith('JL123');
  });

  it('shows loading card for flights that are still fetching details', async () => {
    (useTrackedFlights as jest.Mock).mockReturnValue({
      trackedFlights: [{ flightIata: 'JL123', flightDate: '2024-07-20' }],
      flightDetails: new Map(), // Details not yet loaded
      isLoading: false,
      removeFlight: jest.fn(),
      refreshDetails: jest.fn(),
    });
    render(<TabHomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('JL123')).toBeVisible();
      expect(screen.getByA11yLabel('Loading')).toBeVisible(); // ActivityIndicator for loading card
    });
  });

  it('calls refreshDetails on pull-to-refresh', async () => {
    const mockRefreshDetails = jest.fn();
    (useTrackedFlights as jest.Mock).mockReturnValue({
      trackedFlights: [{ flightIata: 'JL123', flightDate: '2024-07-20' }],
      flightDetails: new Map([['JL123', mockFlight1]]),
      isLoading: false,
      removeFlight: jest.fn(),
      refreshDetails: mockRefreshDetails,
    });
    render(<TabHomeScreen />);

    // The FlatList is rendered, and its `refreshControl` prop contains a `RefreshControl` component.
    // We can simulate the `onRefresh` event by finding the `RefreshControl` and calling its `onRefresh` prop.
    // Since `RefreshControl` is a native component, we can't directly use `fireEvent` on it.
    // We need to access the `onRefresh` prop from the rendered component's instance.

    // A common way to do this in testing-library/react-native is to find a component
    // that renders the `RefreshControl` and then access its props.
    // In this case, `FlatList` renders `RefreshControl` via its `refreshControl` prop.
    // We can find the `FlatList` and then access `refreshControl.props.onRefresh`.

    // To make the FlatList discoverable, we can add a testID to it in the component.
    // For now, let's assume we can find the FlatList and access its internal RefreshControl.
    // This is a bit of a hack, but it's a common pattern for testing RefreshControl.

    // Find the FlatList component. Since there's only one, we can use its role or a generic query.
    // If it's not directly queryable, we might need to mock FlatList to expose its props.
    // For now, let's assume we can get the `RefreshControl` instance.

    // We need to get the `RefreshControl` component's `onRefresh` prop.
    // The `RefreshControl` is passed as a prop to `FlatList`.
    // We can't directly query for `RefreshControl` using `screen.getBy...` unless it has a `testID`.
    // Instead, we can mock `FlatList` to expose its `refreshControl` prop.

    // Let's modify the mock for `FlatList` to allow access to `refreshControl`.
    // However, since `FlatList` is a React Native built-in, we don't mock it unless necessary.
    // The `RefreshControl` component is rendered by `FlatList` via its `refreshControl` prop.
    // We can directly call the `handleRefresh` function which is passed to `onRefresh` of `RefreshControl`.

    // To test this, we need to get a reference to the `handleRefresh` function.
    // Since `handleRefresh` is an internal function of `TabHomeScreen`, we cannot directly call it.
    // The `onRefresh` prop of `RefreshControl` is what we need to trigger.
    // We can simulate this by finding the `RefreshControl` component and calling its `onRefresh` prop.

    // The `RefreshControl` itself is not directly rendered by `TabHomeScreen` but by `FlatList`.
    // We can find the `FlatList` and then access its `refreshControl` prop.
    // Let's add a `testID` to the `FlatList` in the `TabHomeScreen` component for easier access.

    // After adding `testID="tracked-flights-list"` to FlatList:
    const flatList = screen.getByTestId('tracked-flights-list');
    // @ts-expect-error - refreshControl prop type is complex, but we know it's there
    flatList.props.refreshControl.props.onRefresh();

    await waitFor(() => {
      expect(mockRefreshDetails).toHaveBeenCalled();
    });
  });
});
