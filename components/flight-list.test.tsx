import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { FlightList } from './flight-list';
import { useTheme } from './ThemeProvider';
import { useTrackedFlights } from '@/src/hooks/useTrackedFlights';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock external dependencies
jest.mock('./ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('@/src/hooks/useTrackedFlights', () => ({
  useTrackedFlights: jest.fn(),
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
      <button onPress={onToggleTrack}>Toggle Track</button>
    </mock-flight-card>
  )),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('FlightList', () => {
  const mockFlight1 = {
    flightIata: 'JL123',
    airlineName: 'JAL',
    flightDate: '2024-07-20',
    status: 'scheduled',
    departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00Z' },
    arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00Z' },
  };
  const mockFlight2 = {
    flightIata: 'NH456',
    airlineName: 'ANA',
    flightDate: '2024-07-21',
    status: 'active',
    departure: { iata: 'NRT', timezone: 'Asia/Tokyo', scheduled: '2024-07-21T14:00:00Z' },
    arrival: { iata: 'FUK', timezone: 'Asia/Tokyo', scheduled: '2024-07-21T16:00:00Z' },
  };

  const mockOnSelectFlight = jest.fn();
  const mockAddFlight = jest.fn();
  const mockRemoveFlight = jest.fn();
  const mockIsTracked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (useTrackedFlights as jest.Mock).mockReturnValue({
      addFlight: mockAddFlight,
      removeFlight: mockRemoveFlight,
      isTracked: mockIsTracked,
    });
  });

  it('renders loading state when isLoading is true', () => {
    render(<FlightList flights={[]} isLoading={true} error={null} onSelectFlight={mockOnSelectFlight} />);
    expect(screen.getByA11yLabel('Loading')).toBeVisible();
    expect(screen.getByText('flight.list.loading')).toBeVisible();
  });

  it('renders error message when error is present', () => {
    render(<FlightList flights={[]} isLoading={false} error="Something went wrong!" onSelectFlight={mockOnSelectFlight} />);
    expect(screen.getByText('Error: Something went wrong!')).toBeVisible();
    expect(screen.getByText('MaterialCommunityIcons')).toBeVisible(); // Check for icon
  });

  it('renders empty message when no flights and no error/loading', () => {
    render(<FlightList flights={[]} isLoading={false} error={null} onSelectFlight={mockOnSelectFlight} />);
    expect(screen.getByText('flight.list.noResults')).toBeVisible();
    expect(screen.getByText('MaterialCommunityIcons')).toBeVisible(); // Check for icon
  });

  it('renders list of flights', () => {
    render(<FlightList flights={[mockFlight1, mockFlight2]} isLoading={false} error={null} onSelectFlight={mockOnSelectFlight} />);
    expect(screen.getByText('JL123')).toBeVisible();
    expect(screen.getByText('NH456')).toBeVisible();
    expect(screen.getByTestId('flight-card-JL123')).toBeVisible();
    expect(screen.getByTestId('flight-card-NH456')).toBeVisible();
  });

  it('calls onSelectFlight when a flight card is pressed', () => {
    render(<FlightList flights={[mockFlight1]} isLoading={false} error={null} onSelectFlight={mockOnSelectFlight} />);
    fireEvent.press(screen.getByText('JL123')); // Simulate pressing the flight card
    expect(mockOnSelectFlight).toHaveBeenCalledWith(mockFlight1);
  });

  it('calls removeFlight when onToggleTrack is called and flight is tracked', async () => {
    mockIsTracked.mockReturnValue(true);
    render(<FlightList flights={[mockFlight1]} isLoading={false} error={null} onSelectFlight={mockOnSelectFlight} />);
    const toggleButton = screen.getByText('Toggle Track');
    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(mockRemoveFlight).toHaveBeenCalledWith(mockFlight1.flightIata);
    });
    expect(mockAddFlight).not.toHaveBeenCalled();
  });

  it('calls addFlight when onToggleTrack is called and flight is not tracked', async () => {
    mockIsTracked.mockReturnValue(false);
    render(<FlightList flights={[mockFlight1]} isLoading={false} error={null} onSelectFlight={mockOnSelectFlight} />);
    const toggleButton = screen.getByText('Toggle Track');
    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(mockAddFlight).toHaveBeenCalledWith(mockFlight1.flightIata, mockFlight1.flightDate);
    });
    expect(mockRemoveFlight).not.toHaveBeenCalled();
  });
});

