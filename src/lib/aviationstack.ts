import { env } from './env';
import { getCache, setCache } from './kv'; // Import KV functions

// Define a common interface for flight data structure
export interface FlightData {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
    scheduled: string; // UTC datetime string
    estimated: string; // UTC datetime string
    actual: string | null; // UTC datetime string
    revised: string | null; // UTC datetime string
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null;
    scheduled: string; // UTC datetime string
    estimated: string; // UTC datetime string
    actual: string | null; // UTC datetime string
    revised: string | null; // UTC datetime string
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared: Array<{
      airline_name: string;
      airline_iata: string;
      airline_icao: string;
      flight_number: string;
      flight_iata: string;
      flight_icao: string;
    }> | null;
  };
  aircraft: {
    registration: string | null;
    iata: string | null;
    icao: string | null;
    icao24: string | null;
  } | null;
  live: {
    updated: string; // UTC datetime string
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    direction: number | null;
    speed_horizontal: number | null;
    speed_vertical: number | null;
    is_ground: boolean;
  } | null;
}

export interface FlightStatusResponse {
  data: FlightData[];
}

// Define a type for airline information
export interface AirlineInfo {
  airline_id: number;
  airline_name: string;
  iata_code: string;
  icao_code: string;
  callsign: string | null;
  country_name: string;
  fleet_size: number | null;
  fleet_average_age: number | null;
  date_founded: string | null;
  status: string;
  type: string;
}

export interface AirlineInfoResponse {
  data: AirlineInfo[];
}

// Cache TTLs as per spec
const FLIGHT_INFO_CACHE_TTL = 60; // 60 seconds
const AIRLINE_INFO_CACHE_TTL = 24 * 60 * 60; // 24 hours

/**
 * Fetches flight status from Aviationstack API, with caching.
 * This function is intended to be called from a Next.js API Route, not directly from the client.
 * @param flightNumber The flight number (e.g., "UA123").
 * @param flightDate The flight date in YYYY-MM-DD format.
 * @returns FlightStatusResponse or null if an error occurs.
 */
export async function getFlightStatus(flightNumber: string, flightDate: string): Promise<FlightStatusResponse | null> {
  const cacheKey = `flight-status-${flightNumber}-${flightDate}`;
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for flight status: ${cacheKey}`);
      return JSON.parse(cachedData) as FlightStatusResponse; // Assuming cached data conforms to FlightStatusResponse
    }

    // This fetch call MUST be proxied through a Next.js API Route
    // to prevent exposing AVIATIONSTACK_API_KEY to the client.
    // This function is designed to be called server-side (e.g., from a Next.js API Route).
    const response: Response = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${env.AVIATIONSTACK_API_KEY}&flight_number=${flightNumber}&flight_date=${flightDate}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: FlightStatusResponse = await response.json() as FlightStatusResponse; // Assuming API response conforms to FlightStatusResponse
    // Normalize all date/time strings to UTC immediately upon reception if they aren't already.
    // Aviationstack API generally returns UTC, but this is a safeguard.
    data.data.forEach(flight => {
      // Example: If API returns local time, convert to UTC.
      // For Aviationstack, 'scheduled', 'estimated', 'actual', 'revised' are typically UTC.
      // No explicit conversion needed if API guarantees UTC.
      // If not, date-fns-tz would be used here.
    });

    await setCache(cacheKey, JSON.stringify(data), FLIGHT_INFO_CACHE_TTL);
    return data;
  } catch (error: unknown) {
    console.error('Error fetching flight status:', error);
    return null;
  }
}

/**
 * Fetches airline information from Aviationstack API, with caching.
 * This function is intended to be called from a Next.js API Route, not directly from the client.
 * @param airlineIata The IATA code of the airline (e.g., "UA").
 * @returns AirlineInfoResponse or null if an error occurs.
 */
export async function getAirlineInfo(airlineIata: string): Promise<AirlineInfoResponse | null> {
  const cacheKey = `airline-info-${airlineIata}`;
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for airline info: ${cacheKey}`);
      return JSON.parse(cachedData) as AirlineInfoResponse; // Assuming cached data conforms to AirlineInfoResponse
    }

    // This fetch call MUST be proxied through a Next.js API Route
    // to prevent exposing AVIATIONSTACK_API_KEY to the client.
    // This function is designed to be called server-side (e.g., from a Next.js API Route).
    const response: Response = await fetch(
      `http://api.aviationstack.com/v1/airlines?access_key=${env.AVIATIONSTACK_API_KEY}&iata_code=${airlineIata}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: AirlineInfoResponse = await response.json() as AirlineInfoResponse; // Assuming API response conforms to AirlineInfoResponse
    await setCache(cacheKey, JSON.stringify(data), AIRLINE_INFO_CACHE_TTL);
    return data;
  } catch (error: unknown) {
    console.error('Error fetching airline info:', error);
    return null;
  }
}
