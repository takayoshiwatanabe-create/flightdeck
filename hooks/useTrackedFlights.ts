import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrackedFlight, FlightInfo } from '@/types/flight';
import { getFlightByIata } from '@/lib/flightService'; // Corrected import path

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
  const [isLoading, setIsLoading] = useState(true);

  // Load tracked flights from storage
  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const stored = await AsyncStorage.getItem(TRACKED_FLIGHTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TrackedFlight[];
          setTrackedFlights(parsed);
        }
      } catch {
        // ignore parse errors
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  // Fetch flight details when tracked flights change
  const refreshDetails = useCallback(async (): Promise<void> => {
    if (trackedFlights.length === 0) {
      setFlightDetails(new Map());
      return;
    }

    const newDetails = new Map<string, FlightInfo>();
    const results = await Promise.allSettled(
      trackedFlights.map((tf) => getFlightByIata(tf.flightIata, tf.flightDate))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        newDetails.set(trackedFlights[index].flightIata, result.value);
      }
    });

    setFlightDetails(newDetails);
  }, [trackedFlights]);

  useEffect(() => {
    if (!isLoading) {
      void refreshDetails();
    }
  }, [trackedFlights, isLoading, refreshDetails]);

  const persist = useCallback(async (flights: TrackedFlight[]): Promise<void> => {
    await AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(flights));
  }, []);

  const addFlight = useCallback(
    async (flightIata: string, flightDate: string): Promise<void> => {
      const exists = trackedFlights.some((f) => f.flightIata === flightIata);
      if (exists) return;

      const updated = [
        ...trackedFlights,
        { flightIata, flightDate, addedAt: new Date().toISOString() },
      ];
      setTrackedFlights(updated);
      await persist(updated);
    },
    [trackedFlights, persist]
  );

  const removeFlight = useCallback(
    async (flightIata: string): Promise<void> => {
      const updated = trackedFlights.filter((f) => f.flightIata !== flightIata);
      setTrackedFlights(updated);
      await persist(updated);
    },
    [trackedFlights, persist]
  );

  const isTracked = useCallback(
    (flightIata: string): boolean => {
      return trackedFlights.some((f) => f.flightIata === flightIata);
    },
    [trackedFlights]
  );

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

