import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTrackedFlights } from './useTrackedFlights';
import { fetchFlightDetails } from '@/src/lib/flightService';
import { useQueryClient } from '@tanstack/react-query';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('@/src/lib/flightService', () => ({
  fetchFlightDetails: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

describe('useTrackedFlights', () => {
  const MOCK_CURRENT_DATE = new Date('2024-07-20T12:00:00Z');
  const mockFlightInfo = {
    flightIata: 'JL123',
    airlineName: 'JAL',
    flightDate: '2024-07-20',
    status: 'scheduled',
    departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00Z' },
    arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00Z' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_CURRENT_DATE);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // Default: no stored data
    (fetchFlightDetails as jest.Mock).mockResolvedValue(mockFlightInfo);
    (useQueryClient as jest.Mock).mockReturnValue({
      invalidateQueries: jest.fn(),
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('initializes with empty tracked flights and details if no data in storage', async () => {
    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(result.current.trackedFlights).toEqual([]);
      expect(result.current.flightDetails.size).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('loads tracked flights from AsyncStorage on mount', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(null); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(result.current.trackedFlights).toEqual([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('adds a flight and persists to AsyncStorage', async () => {
    const { result } = renderHook(() => useTrackedFlights());

    await act(async () => {
      await result.current.addFlight('JL123', '2024-07-20');
    });

    expect(result.current.trackedFlights).toEqual([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tracked_flights',
      JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }])
    );
    expect(fetchFlightDetails).toHaveBeenCalledWith('JL123', '2024-07-20');
    expect(result.current.flightDetails.get('JL123')).toEqual(mockFlightInfo);
  });

  it('removes a flight and persists to AsyncStorage', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(null); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());
    await waitFor(() => expect(result.current.trackedFlights).toHaveLength(1));

    await act(async () => {
      await result.current.removeFlight('JL123');
    });

    expect(result.current.trackedFlights).toEqual([]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('tracked_flights', '[]');
    expect(result.current.flightDetails.has('JL123')).toBe(false);
  });

  it('checks if a flight is tracked', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(null); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());
    await waitFor(() => expect(result.current.trackedFlights).toHaveLength(1));

    expect(result.current.isTracked('JL123')).toBe(true);
    expect(result.current.isTracked('NH456')).toBe(false);
  });

  it('fetches flight details for tracked flights on mount', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(null); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(fetchFlightDetails).toHaveBeenCalledWith('JL123', '2024-07-20');
      expect(result.current.flightDetails.get('JL123')).toEqual(mockFlightInfo);
    });
  });

  it('uses cached flight details if not expired', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    const cachedFlightDetails = JSON.stringify({
      JL123: { data: mockFlightInfo, timestamp: MOCK_CURRENT_DATE.getTime() },
    });
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(cachedFlightDetails); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(fetchFlightDetails).not.toHaveBeenCalled(); // Should use cache
      expect(result.current.flightDetails.get('JL123')).toEqual(mockFlightInfo);
    });
  });

  it('fetches new data if cached flight details are expired', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    const expiredTimestamp = MOCK_CURRENT_DATE.getTime() - (60 * 1000 + 1); // 60 seconds + 1ms ago
    const cachedFlightDetails = JSON.stringify({
      JL123: { data: { ...mockFlightInfo, status: 'landed' }, timestamp: expiredTimestamp },
    });
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(cachedFlightDetails); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(fetchFlightDetails).toHaveBeenCalledWith('JL123', '2024-07-20'); // Should re-fetch
      expect(result.current.flightDetails.get('JL123')).toEqual(mockFlightInfo); // Updated data
    });
  });

  it('falls back to expired cached data if network request fails', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    const expiredTimestamp = MOCK_CURRENT_DATE.getTime() - (60 * 1000 + 1); // 60 seconds + 1ms ago
    const oldFlightInfo = { ...mockFlightInfo, status: 'landed' };
    const cachedFlightDetails = JSON.stringify({
      JL123: { data: oldFlightInfo, timestamp: expiredTimestamp },
    });
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(cachedFlightDetails); // flight_details_cache
    (fetchFlightDetails as jest.Mock).mockRejectedValueOnce(new Error('Network error')); // API call fails

    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(fetchFlightDetails).toHaveBeenCalledWith('JL123', '2024-07-20');
      expect(result.current.flightDetails.get('JL123')).toEqual({
        ...oldFlightInfo,
        isOfflineData: true, // Should mark as offline data
      });
    });
  });

  it('sets isOfflineData to true when fetching fails and no cache exists', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(null); // flight_details_cache
    (fetchFlightDetails as jest.Mock).mockRejectedValueOnce(new Error('Network error')); // API call fails

    const { result } = renderHook(() => useTrackedFlights());

    await waitFor(() => {
      expect(fetchFlightDetails).toHaveBeenCalledWith('JL123', '2024-07-20');
      expect(result.current.flightDetails.get('JL123')).toEqual({
        flightIata: 'JL123',
        flightDate: '2024-07-20',
        isOfflineData: true,
        status: 'unknown', // Default status for failed fetch with no cache
        airlineName: 'common.unknownAirline',
        departure: { iata: 'N/A', timezone: 'UTC', scheduled: null, estimated: null, actual: null, terminal: null, gate: null, delay: null },
        arrival: { iata: 'N/A', timezone: 'UTC', scheduled: null, estimated: null, actual: null, terminal: null, gate: null, delay: null },
      });
    });
  });

  it('refreshes details and updates cache', async () => {
    const storedTrackedFlights = JSON.stringify([{ flightIata: 'JL123', flightDate: '2024-07-20' }]);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(storedTrackedFlights) // tracked_flights
      .mockResolvedValueOnce(null); // flight_details_cache

    const { result } = renderHook(() => useTrackedFlights());
    await waitFor(() => expect(result.current.flightDetails.size).toBe(1));

    const updatedFlightInfo = { ...mockFlightInfo, status: 'landed' };
    (fetchFlightDetails as jest.Mock).mockResolvedValueOnce(updatedFlightInfo);

    await act(async () => {
      await result.current.refreshDetails();
    });

    expect(fetchFlightDetails).toHaveBeenCalledTimes(2); // Initial fetch + refresh
    expect(result.current.flightDetails.get('JL123')).toEqual(updatedFlightInfo);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'flight_details_cache',
      JSON.stringify({
        JL123: { data: updatedFlightInfo, timestamp: MOCK_CURRENT_DATE.getTime() },
      })
    );
  });

  it('handles AsyncStorage errors during load/save gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage read error'));
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage write error'));

    const { result } = renderHook(() => useTrackedFlights());

    await act(async () => {
      await result.current.addFlight('JL123', '2024-07-20');
    });

    expect(console.error).toHaveBeenCalledWith('Error loading tracked flights:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error saving tracked flights:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error saving flight details cache:', expect.any(Error));
    expect(result.current.trackedFlights).toEqual([{ flightIata: 'JL123', flightDate: '2024-07-20' }]); // State still updates
    jest.restoreAllMocks();
  });
});

