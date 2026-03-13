import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchFlightDetails } from '@/lib/flightService';
import { type FlightInfo } from '@/types/flight';

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

const TRACKED_FLIGHTS_KEY = 'tracked_flights';

export function useTrackedFlights(): UseTrackedFlightsResult {
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [flightDetails, setFlightDetails] = useState<Map<string, FlightInfo>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTrackedFlights = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const storedFlights = await AsyncStorage.getItem(TRACKED_FLIGHTS_KEY);
      const parsedFlights: TrackedFlight[] = storedFlights ? JSON.parse(storedFlights) : [];
      setTrackedFlights(parsedFlights);

      // Fetch details for all tracked flights
      const detailsMap = new Map<string, FlightInfo>();
      const fetchPromises = parsedFlights.map(async (flight) => {
        try {
          const detail = await fetchFlightDetails(flight.flightIata, flight.flightDate);
          if (detail) {
            detailsMap.set(flight.flightIata, detail);
          }
        } catch (e: unknown) {
          console.error(`Failed to fetch details for ${flight.flightIata}:`, e);
          // Optionally, handle individual flight fetch errors (e.g., show a stale data indicator)
        }
      });
      await Promise.all(fetchPromises);
      setFlightDetails(detailsMap);
    } catch (e: unknown) {
      console.error('Failed to load tracked flights or their details:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrackedFlights();
  }, [loadTrackedFlights]);

  const saveTrackedFlights = async (flights: TrackedFlight[]): Promise<void> => {
    await AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(flights));
    setTrackedFlights(flights);
  };

  const addFlight = async (flightIata: string, flightDate: string): Promise<void> => {
    if (!trackedFlights.some(f => f.flightIata === flightIata)) {
      const newFlights = [...trackedFlights, { flightIata, flightDate }];
      await saveTrackedFlights(newFlights);
      // Immediately fetch and add new flight's details
      try {
        const detail = await fetchFlightDetails(flightIata, flightDate);
        if (detail) {
          setFlightDetails(prev => new Map(prev).set(flightIata, detail));
        }
      } catch (e: unknown) {
        console.error(`Failed to fetch details for new tracked flight ${flightIata}:`, e);
      }
    }
  };

  const removeFlight = async (flightIata: string): Promise<void> => {
    const newFlights = trackedFlights.filter(f => f.flightIata !== flightIata);
    await saveTrackedFlights(newFlights);
    setFlightDetails(prev => {
      const newMap = new Map(prev);
      newMap.delete(flightIata);
      return newMap;
    });
  };

  const isTracked = (flightIata: string): boolean => {
    return trackedFlights.some(f => f.flightIata === flightIata);
  };

  const refreshDetails = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const detailsMap = new Map<string, FlightInfo>();
    const fetchPromises = trackedFlights.map(async (flight) => {
      try {
        const detail = await fetchFlightDetails(flight.flightIata, flight.flightDate);
        if (detail) {
          detailsMap.set(flight.flightIata, detail);
        }
      } catch (e: unknown) {
        console.error(`Failed to refresh details for ${flight.flightIata}:`, e);
      }
    });
    await Promise.all(fetchPromises);
    setFlightDetails(detailsMap);
    setIsLoading(false);
  }, [trackedFlights]);

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
