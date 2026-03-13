import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFlightByIata } from '@/lib/flightService';
import { type FlightInfo } from '@/types/flight';
import { format } from 'date-fns'; // Correct import for date-fns

const TRACKED_FLIGHTS_KEY = 'tracked_flights';

interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD format
}

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
      const parsedFlights: TrackedFlight[] = storedFlights ? JSON.parse(storedFlights) : [];
      setTrackedFlights(parsedFlights);
    } catch (error: unknown) {
      console.error('Failed to load tracked flights:', error);
      setTrackedFlights([]);
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
    const newDetails = new Map<string, FlightInfo>();
    const fetchPromises = flightsToFetch.map(async (tf) => {
      try {
        const detail = await getFlightByIata(tf.flightIata, tf.flightDate);
        if (detail) {
          newDetails.set(tf.flightIata, detail);
        } else {
          console.warn(`Could not fetch details for flight ${tf.flightIata}`);
        }
      } catch (error: unknown) {
        console.error(`Error fetching details for ${tf.flightIata}:`, error);
      }
    });
    await Promise.all(fetchPromises);
    setFlightDetails(newDetails);
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
      const newFlight: TrackedFlight = { flightIata, flightDate };
      if (!trackedFlights.some((f) => f.flightIata === flightIata)) {
        const updatedFlights = [...trackedFlights, newFlight];
        setTrackedFlights(updatedFlights);
        await saveTrackedFlights(updatedFlights);
        // Immediately fetch details for the newly added flight
        const detail = await getFlightByIata(flightIata, flightDate);
        if (detail) {
          setFlightDetails((prev) => new Map(prev).set(flightIata, detail));
        }
      }
    },
    [trackedFlights, saveTrackedFlights]
  );

  const removeFlight = useCallback(
    async (flightIata: string): Promise<void> => {
      const updatedFlights = trackedFlights.filter((f) => f.flightIata !== flightIata);
      setTrackedFlights(updatedFlights);
      await saveTrackedFlights(updatedFlights);
      setFlightDetails((prev) => {
        const newMap = new Map(prev);
        newMap.delete(flightIata);
        return newMap;
      });
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
