import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFlightByIata } from '@/lib/flightService';
import { type FlightInfo } from '@/types/flight';

const TRACKED_FLIGHTS_KEY = 'tracked_flights';

interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD
}

interface UseTrackedFlightsResult {
  trackedFlights: TrackedFlight[];
  flightDetails: Map<string, FlightInfo>;
  isLoading: boolean;
  addFlight: (flightIata: string, flightDate: string) => Promise<void>;
  removeFlight: (flightIata: string) => Promise<void>;
  isFlightTracked: (flightIata: string) => boolean;
  refreshDetails: () => Promise<void>;
}

export function useTrackedFlights(): UseTrackedFlightsResult {
  const queryClient = useQueryClient();
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);

  // Load tracked flights from AsyncStorage on mount
  useEffect(() => {
    const loadTrackedFlights = async (): Promise<void> => {
      try {
        const storedFlights = await AsyncStorage.getItem(TRACKED_FLIGHTS_KEY);
        if (storedFlights) {
          setTrackedFlights(JSON.parse(storedFlights) as TrackedFlight[]);
        }
      } catch (error: unknown) {
        console.error('Failed to load tracked flights from storage:', error);
      }
    };
    void loadTrackedFlights();
  }, []);

  // Use React Query to fetch details for all tracked flights
  const flightDetailsQuery = useQuery<Map<string, FlightInfo>, Error, Map<string, FlightInfo>, Array<readonly [string, string]>>({
    queryKey: ['flightDetails', trackedFlights.map(f => [f.flightIata, f.flightDate])],
    queryFn: async ({ queryKey }) => {
      const [, flightKeys] = queryKey;
      const detailsMap = new Map<string, FlightInfo>();
      const fetchPromises = flightKeys.map(async ([iata, date]) => {
        try {
          const flight = await getFlightByIata(iata, date);
          if (flight) {
            detailsMap.set(iata, flight);
          }
        } catch (error: unknown) {
          console.error(`Failed to fetch details for flight ${iata} on ${date}:`, error);
        }
      });
      await Promise.all(fetchPromises);
      return detailsMap;
    },
    enabled: trackedFlights.length > 0,
    staleTime: 60 * 1000, // Cache for 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const addFlight = useCallback(async (flightIata: string, flightDate: string): Promise<void> => {
    setTrackedFlights((prev) => {
      // Ensure no duplicates
      if (prev.some(f => f.flightIata === flightIata && f.flightDate === flightDate)) {
        return prev;
      }
      const newFlights = [...prev, { flightIata, flightDate }];
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      void queryClient.invalidateQueries({ queryKey: ['flightDetails'] }); // Invalidate to refetch new flight
      return newFlights;
    });
  }, [queryClient]);

  const removeFlight = useCallback(async (flightIata: string): Promise<void> => {
    setTrackedFlights((prev) => {
      const newFlights = prev.filter((f) => f.flightIata !== flightIata);
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      void queryClient.invalidateQueries({ queryKey: ['flightDetails'] }); // Invalidate to remove from cache
      return newFlights;
    });
  }, [queryClient]);

  const isFlightTracked = useCallback((flightIata: string): boolean => {
    return trackedFlights.some((f) => f.flightIata === flightIata);
  }, [trackedFlights]);

  const refreshDetails = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['flightDetails'] });
    await queryClient.refetchQueries({ queryKey: ['flightDetails'] });
  }, [queryClient]);

  return {
    trackedFlights,
    flightDetails: flightDetailsQuery.data ?? new Map(),
    isLoading: flightDetailsQuery.isLoading,
    addFlight,
    removeFlight,
    isFlightTracked,
    refreshDetails,
  };
}
