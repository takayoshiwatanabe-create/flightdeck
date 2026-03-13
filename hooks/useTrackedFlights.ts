import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getFlightByIata } from '@/lib/flightService';
import { type FlightInfo } from '@/types/flight';

const TRACKED_FLIGHTS_KEY = 'trackedFlights';

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
  isTracked: (flightIata: string) => boolean;
  refreshDetails: () => Promise<void>;
}

export function useTrackedFlights(): UseTrackedFlightsResult {
  const queryClient = useQueryClient();
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);

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

  // Use TanStack Query to fetch details for all tracked flights
  const { data: flightDetailsMap, isLoading } = useQuery<Map<string, FlightInfo>, Error>({
    queryKey: ['trackedFlightDetails', trackedFlights],
    queryFn: async () => {
      const details = new Map<string, FlightInfo>();
      const fetchPromises = trackedFlights.map(async (tf) => {
        try {
          const flight = await getFlightByIata(tf.flightIata, tf.flightDate);
          if (flight) {
            details.set(tf.flightIata, flight);
          }
        } catch (error: unknown) {
          console.error(`Failed to fetch details for ${tf.flightIata}:`, error);
        }
      });
      await Promise.all(fetchPromises);
      return details;
    },
    // Refresh every 60 seconds as per spec (Flight information = 60 seconds)
    refetchInterval: 60 * 1000,
    initialData: new Map(), // Initialize with an empty map
  });

  const addFlight = useCallback(async (flightIata: string, flightDate: string): Promise<void> => {
    setTrackedFlights((prev) => {
      const newFlights = [...prev];
      if (!newFlights.some((f) => f.flightIata === flightIata)) {
        newFlights.push({ flightIata, flightDate });
        void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
        // Invalidate and refetch details for the new flight
        void queryClient.invalidateQueries({ queryKey: ['trackedFlightDetails'] });
      }
      return newFlights;
    });
  }, [queryClient]);

  const removeFlight = useCallback(async (flightIata: string): Promise<void> => {
    setTrackedFlights((prev) => {
      const newFlights = prev.filter((f) => f.flightIata !== flightIata);
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      // Invalidate and refetch details after removal
      void queryClient.invalidateQueries({ queryKey: ['trackedFlightDetails'] });
      return newFlights;
    });
  }, [queryClient]);

  const isTracked = useCallback((flightIata: string): boolean => {
    return trackedFlights.some((f) => f.flightIata === flightIata);
  }, [trackedFlights]);

  const refreshDetails = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['trackedFlightDetails'] });
    await queryClient.refetchQueries({ queryKey: ['trackedFlightDetails'] });
  }, [queryClient]);

  return {
    trackedFlights,
    flightDetails: flightDetailsMap ?? new Map(),
    isLoading,
    addFlight,
    removeFlight,
    isTracked,
    refreshDetails,
  };
}
