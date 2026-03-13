import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFlightByIata } from '@/lib/flightService';
import { type FlightInfo } from '@/types/flight';

interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD
}

const TRACKED_FLIGHTS_KEY = 'tracked_flights';

export function useTrackedFlights(): {
  trackedFlights: TrackedFlight[];
  flightDetails: Map<string, FlightInfo>;
  isLoading: boolean;
  addFlight: (flightIata: string, flightDate: string) => Promise<void>;
  removeFlight: (flightIata: string) => Promise<void>;
  isTracked: (flightIata: string) => boolean;
  refreshDetails: () => Promise<void>;
} {
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const queryClient = useQueryClient();

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
      }
    }
    void loadTrackedFlights();
  }, []);

  // Use React Query to fetch details for all tracked flights
  const flightDetailsQuery = useQuery<Map<string, FlightInfo>, Error, Map<string, FlightInfo>, (string | TrackedFlight[])[]>(
    {
      queryKey: ['flightDetails', trackedFlights],
      queryFn: async ({ queryKey }) => {
        const [, flightsToFetch] = queryKey as [string, TrackedFlight[]];
        const detailsMap = new Map<string, FlightInfo>();
        const fetchPromises = flightsToFetch.map(async (flight) => {
          try {
            const detail = await getFlightByIata(flight.flightIata, flight.flightDate);
            if (detail) {
              detailsMap.set(flight.flightIata, detail);
            }
          } catch (error: unknown) {
            console.error(`Failed to fetch details for ${flight.flightIata}:`, error);
          }
        });
        await Promise.all(fetchPromises);
        return detailsMap;
      },
      enabled: trackedFlights.length > 0, // Only run query if there are flights to track
      staleTime: 60 * 1000, // 60 seconds stale time for flight data
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
    }
  );

  const addFlight = useCallback(
    async (flightIata: string, flightDate: string): Promise<void> => {
      const newFlight: TrackedFlight = { flightIata, flightDate };
      setTrackedFlights((prevFlights) => {
        if (prevFlights.some((f) => f.flightIata === flightIata)) {
          return prevFlights; // Already tracked
        }
        const updatedFlights = [...prevFlights, newFlight];
        void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(updatedFlights));
        // Invalidate and refetch flight details for the new flight
        void queryClient.invalidateQueries({ queryKey: ['flightDetails'] });
        return updatedFlights;
      });
    },
    [queryClient]
  );

  const removeFlight = useCallback(
    async (flightIata: string): Promise<void> => {
      setTrackedFlights((prevFlights) => {
        const updatedFlights = prevFlights.filter((f) => f.flightIata !== flightIata);
        void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(updatedFlights));
        // Invalidate and refetch flight details (or just remove from cache)
        void queryClient.invalidateQueries({ queryKey: ['flightDetails'] });
        return updatedFlights;
      });
    },
    [queryClient]
  );

  const isTracked = useCallback(
    (flightIata: string): boolean => {
      return trackedFlights.some((f) => f.flightIata === flightIata);
    },
    [trackedFlights]
  );

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
    isTracked,
    refreshDetails,
  };
}
