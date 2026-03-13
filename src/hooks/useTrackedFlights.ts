import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchFlightDetails } from '@/src/lib/flightService';
import { type FlightInfo } from '@/types/flight';

const TRACKED_FLIGHTS_KEY = 'tracked_flights';
const FLIGHT_DETAILS_CACHE_KEY = 'flight_details_cache';
const CACHE_TTL_SECONDS = 60; // 60 seconds as per CLAUDE.md 5.1

interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD
}

interface CachedFlightDetails {
  data: FlightInfo;
  timestamp: number; // Unix timestamp in milliseconds
}

interface UseTrackedFlightsResult {
  trackedFlights: TrackedFlight[];
  flightDetails: Map<string, FlightInfo>;
  isLoading: boolean;
  addFlight: (flightIata: string, flightDate: string) => Promise<void>;
  removeFlight: (flightIata: string) => Promise<void>;
  isTracked: (flightIata: string) => boolean;
  refreshDetails: () => Promise<void>;
  isOfflineData: boolean; // New state to indicate if data is from cache due to offline
  error: string | null; // New state for network/fetch errors
}

export function useTrackedFlights(): UseTrackedFlightsResult {
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [flightDetails, setFlightDetails] = useState<Map<string, FlightInfo>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOfflineData, setIsOfflineData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get cached flight details
  const getCachedFlightDetails = useCallback(async (): Promise<Map<string, CachedFlightDetails>> => {
    try {
      const cachedDataStr = await AsyncStorage.getItem(FLIGHT_DETAILS_CACHE_KEY);
      return cachedDataStr ? new Map(JSON.parse(cachedDataStr) as Array<[string, CachedFlightDetails]>) : new Map();
    } catch (e: unknown) {
      console.error('Failed to load flight details cache:', e);
      return new Map();
    }
  }, []);

  // Helper to set cached flight details
  const setCachedFlightDetails = useCallback(async (cache: Map<string, CachedFlightDetails>): Promise<void> => {
    try {
      await AsyncStorage.setItem(FLIGHT_DETAILS_CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
    } catch (e: unknown) {
      console.error('Failed to save flight details cache:', e);
    }
  }, []);

  // Load tracked flights from AsyncStorage
  useEffect(() => {
    async function loadTrackedFlights(): Promise<void> {
      try {
        const storedFlights = await AsyncStorage.getItem(TRACKED_FLIGHTS_KEY);
        if (storedFlights) {
          setTrackedFlights(JSON.parse(storedFlights) as TrackedFlight[]);
        }
      } catch (e: unknown) {
        console.error('Failed to load tracked flights from storage:', e);
      } finally {
        setIsLoading(false);
      }
    }
    void loadTrackedFlights();
  }, []);

  // Fetch details for tracked flights, with offline-first logic
  const fetchDetails = useCallback(async (flightsToFetch: TrackedFlight[]): Promise<void> => {
    if (flightsToFetch.length === 0) {
      setFlightDetails(new Map());
      setIsLoading(false);
      setIsOfflineData(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    let anyOfflineDataUsed = false;
    const newDetails = new Map<string, FlightInfo>();
    const currentCache = await getCachedFlightDetails();
    const updatedCache = new Map(currentCache); // Create a mutable copy

    const fetchPromises = flightsToFetch.map(async (flight) => {
      const cached = currentCache.get(flight.flightIata);
      const now = Date.now();
      const isCacheExpired = cached ? (now - cached.timestamp) / 1000 > CACHE_TTL_SECONDS : true;

      if (cached && !isCacheExpired) {
        // Use valid cached data
        newDetails.set(flight.flightIata, cached.data);
      } else {
        // Try to fetch from network
        try {
          const details = await fetchFlightDetails(flight.flightIata, flight.flightDate);
          if (details) {
            newDetails.set(flight.flightIata, details);
            updatedCache.set(flight.flightIata, { data: details, timestamp: now });
          } else {
            // If network fetch returns null, fall back to expired cache if available
            if (cached) {
              newDetails.set(flight.flightIata, cached.data);
              anyOfflineDataUsed = true;
            } else {
              // No network data and no cached data
              setError('flight.list.error.generic'); // Or a more specific "no data" error
            }
          }
        } catch (e: unknown) {
          console.error(`Failed to fetch details for ${flight.flightIata} from network:`, e);
          // Network error, fall back to expired cache if available
          if (cached) {
            newDetails.set(flight.flightIata, cached.data);
            anyOfflineDataUsed = true;
          } else {
            // No network data and no cached data
            setError('common.noNetworkNoData');
          }
        }
      }
    });

    await Promise.all(fetchPromises);
    await setCachedFlightDetails(updatedCache); // Persist updated cache
    setFlightDetails(newDetails);
    setIsOfflineData(anyOfflineDataUsed);
    setIsLoading(false);
  }, [getCachedFlightDetails, setCachedFlightDetails]);

  useEffect(() => {
    void fetchDetails(trackedFlights);
  }, [trackedFlights, fetchDetails]);

  const addFlight = useCallback(async (flightIata: string, flightDate: string): Promise<void> => {
    setTrackedFlights(prev => {
      if (prev.some(f => f.flightIata === flightIata)) {
        return prev;
      }
      const newFlights = [...prev, { flightIata, flightDate }];
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      return newFlights;
    });
  }, []);

  const removeFlight = useCallback(async (flightIata: string): Promise<void> => {
    setTrackedFlights(prev => {
      const newFlights = prev.filter(f => f.flightIata !== flightIata);
      void AsyncStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(newFlights));
      return newFlights;
    });
    setFlightDetails(prev => {
      const newDetails = new Map(prev);
      newDetails.delete(flightIata);
      return newDetails;
    });
    // Also remove from cache
    const currentCache = await getCachedFlightDetails();
    currentCache.delete(flightIata);
    void setCachedFlightDetails(currentCache);
  }, [getCachedFlightDetails, setCachedFlightDetails]);

  const isTracked = useCallback((flightIata: string): boolean => {
    return trackedFlights.some(f => f.flightIata === flightIata);
  }, [trackedFlights]);

  const refreshDetails = useCallback(async (): Promise<void> => {
    await fetchDetails(trackedFlights);
  }, [trackedFlights, fetchDetails]);

  return {
    trackedFlights,
    flightDetails,
    isLoading,
    addFlight,
    removeFlight,
    isTracked,
    refreshDetails,
    isOfflineData,
    error,
  };
}

