import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFlightDetails } from '@/src/lib/flightService';
import { type FlightInfo } from '@/types/flight';

interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD format
}

interface UseTrackedFlightsReturn {
  trackedFlights: TrackedFlight[];
  flightDetails: Map<string, FlightInfo>;
  isLoading: boolean;
  addFlight: (flightIata: string, flightDate: string) => Promise<void>;
  removeFlight: (flightIata: string) => Promise<void>;
  isTracked: (flightIata: string) => boolean;
  refreshDetails: () => Promise<void>;
}

const TRACKED_FLIGHTS_KEY = 'tracked_flights';

export function useTrackedFlights(): UseTrackedFlightsReturn {
  const queryClient = useQueryClient();
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Load tracked flights from AsyncStorage on mount
  useEffect(() => {
    async function loadTrackedFlights(): Promise<void> {
      try {
        const storedFlights = await AsyncStorage.getItem(TRACKED_FLIGHTS_KEY);
        if (storedFlights) {
          setTrackedFlights(JSON.parse(storedFlights) as TrackedFlight[]);
        }
      } catch (error: unknown) {
        console.error('Failed to load tracked flights from storage:', error);
      } finally {
        setIsInitialLoading(false);
      }
    }
    void loadTrackedFlights();
  }, []);

  // Use React Query to fetch details for all tracked flights
  const flightDetailsQuery = useQuery<Map<string, FlightInfo>, Error, Map<string, FlightInfo>, (string | TrackedFlight[])[]>(
    {
      queryKey: ['flightDetails', trackedFlights],
      queryFn: async ({ queryKey }) => {
        const [, flightsToFetch] = queryKey;
        const detailsMap = new Map<string, FlightInfo>();
        if (flightsToFetch.length === 0) return detailsMap;

        const fetchPromises = flightsToFetch.map(async (tf) => {
          try {
            const details = await fetchFlightDetails(tf.flightIata, tf.flightDate);
            if (details) {
              detailsMap.set(tf.flightIata, details);
            }
          } catch (error: unknown) {
            console.error(`Failed to fetch details for ${tf.flightIata}:`, error);
          }
        });
        await Promise.all(fetchPromises);
        return detailsMap;
      },
      enabled: !isInitialLoading, // Only run query after initial tracked flights are loaded
      staleTime: 60 * 1000, // 60 seconds stale time for flight data as per CLAUDE.md
      refetchInterval: 60 * 1000, // Refetch every 60 seconds
    }
  );

  const addFlight = useCallback(async (flightIata: string, flightDate: string): Promise<void> => {
    setTrackedFlights(prev => {
      const newFlights = [...prev, { flightIata, flightDate }];
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      // Invalidate and refetch specific flight details
      void queryClient.invalidateQueries({ queryKey: ['flightDetails', { flightIata }] });
      return newFlights;
    });
  }, [queryClient]);

  const removeFlight = useCallback(async (flightIata: string): Promise<void> => {
    setTrackedFlights(prev => {
      const newFlights = prev.filter(f => f.flightIata !== flightIata);
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      // Remove specific flight details from cache
      queryClient.removeQueries({ queryKey: ['flightDetails', { flightIata }] });
      return newFlights;
    });
  }, [queryClient]);

  const isTracked = useCallback((flightIata: string): boolean => {
    return trackedFlights.some(f => f.flightIata === flightIata);
  }, [trackedFlights]);

  const refreshDetails = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['flightDetails'] });
    await queryClient.refetchQueries({ queryKey: ['flightDetails'] });
  }, [queryClient]);

  return {
    trackedFlights,
    flightDetails: flightDetailsQuery.data ?? new Map(),
    isLoading: isInitialLoading || flightDetailsQuery.isLoading,
    addFlight,
    removeFlight,
    isTracked,
    refreshDetails,
  };
}
