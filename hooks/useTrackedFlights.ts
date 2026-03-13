import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFlightByIata } from '@/lib/flightService';
import { type FlightInfo } from '@/types/flight';
import { format } from 'date-fns'; // Import format from date-fns

interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD format
  trackedAt: string; // ISO string
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
  const [flightDetails, setFlightDetails] = useState<Map<string, FlightInfo>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTrackedFlights = useCallback(async (): Promise<void> => {
    try {
      const storedFlights = await AsyncStorage.getItem(TRACKED_FLIGHTS_KEY);
      if (storedFlights) {
        const parsedFlights: TrackedFlight[] = JSON.parse(storedFlights);
        setTrackedFlights(parsedFlights);
      }
    } catch (error: unknown) {
      console.error('Failed to load tracked flights:', error);
    }
  }, []);

  const saveTrackedFlights = useCallback(async (flights: TrackedFlight[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(flights));
    } catch (error: unknown) {
      console.error('Failed to save tracked flights:', error);
    }
  }, []);

  const fetchFlightDetails = useCallback(async (flightsToFetch: TrackedFlight[]): Promise<void> => {
    setIsLoading(true);
    const newFlightDetails = new Map<string, FlightInfo>();
    const fetchPromises = flightsToFetch.map(async (tf) => {
      try {
        const detail = await getFlightByIata(tf.flightIata, tf.flightDate);
        if (detail) {
          newFlightDetails.set(tf.flightIata, detail);
        }
      } catch (error: unknown) {
        console.error(`Failed to fetch details for ${tf.flightIata}:`, error);
      }
    });
    await Promise.all(fetchPromises);
    setFlightDetails(newFlightDetails);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadTrackedFlights();
  }, [loadTrackedFlights]);

  useEffect(() => {
    if (trackedFlights.length > 0) {
      void fetchFlightDetails(trackedFlights);
    } else {
      setFlightDetails(new Map());
      setIsLoading(false);
    }
  }, [trackedFlights, fetchFlightDetails]);

  const addFlight = useCallback(
    async (flightIata: string, flightDate: string): Promise<void> => {
      const newFlight: TrackedFlight = {
        flightIata,
        flightDate,
        trackedAt: new Date().toISOString(),
      };
      const updatedFlights = [...trackedFlights, newFlight];
      setTrackedFlights(updatedFlights);
      await saveTrackedFlights(updatedFlights);
    },
    [trackedFlights, saveTrackedFlights]
  );

  const removeFlight = useCallback(
    async (flightIata: string): Promise<void> => {
      const updatedFlights = trackedFlights.filter((f) => f.flightIata !== flightIata);
      setTrackedFlights(updatedFlights);
      await saveTrackedFlights(updatedFlights);
    },
    [trackedFlights, saveTrackedFlights]
  );

  const isTracked = useCallback(
    (flightIata: string): boolean => {
      return trackedFlights.some((f) => f.flightIata === flightIata);
    },
    [trackedFlights]
  );

  const refreshDetails = useCallback(async (): Promise<void> => {
    await fetchFlightDetails(trackedFlights);
  }, [fetchFlightDetails, trackedFlights]);

  return {
    trackedFlights,
    flightDetails,
    isLoading,
    addFlight,
    removeFlight,
    isTracked,
    refreshDetails,
  };
}
