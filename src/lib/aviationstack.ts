import { env } from './env';
import { getCache, setCache } from './kv'; // Import KV functions

interface FlightStatusResponse {
  data: Array<{
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
      scheduled: string;
      estimated: string;
      actual: string | null;
      revised: string | null;
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
      scheduled: string;
      estimated: string;
      actual: string | null;
      revised: string | null;
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
      updated: string;
      latitude: number | null;
      longitude: number | null;
      altitude: number | null;
      direction: number | null;
      speed_horizontal: number | null;
      speed_vertical: number | null;
      is_ground: boolean;
    } | null;
  }>;
}

// Define a type for airline information
interface AirlineInfoResponse {
  data: Array<{
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
  }>;
}

// Cache TTLs as per spec
const FLIGHT_INFO_CACHE_TTL = 60; // 60 seconds
const AIRLINE_INFO_CACHE_TTL = 24 * 60 * 60; // 24 hours

export async function getFlightStatus(flightNumber: string, flightDate: string): Promise<FlightStatusResponse | null> {
  const cacheKey = `flight-status-${flightNumber}-${flightDate}`;
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for flight status: ${cacheKey}`);
      return JSON.parse(cachedData) as FlightStatusResponse;
    }

    // The spec states "クライアントから外部APIに直接アクセスしてはならない" (Client must not directly access external API).
    // This `fetch` call is currently direct from the client-side `src/lib/aviationstack.ts`.
    // This needs to be proxied through a Next.js API Route.
    // For the current Expo-only context, this direct call is a temporary placeholder.
    // When integrating with Next.js, this logic should move to a Next.js API Route.
    const response: Response = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${env.AVIATIONSTACK_API_KEY}&flight_number=${flightNumber}&flight_date=${flightDate}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: FlightStatusResponse = await response.json() as FlightStatusResponse;
    await setCache(cacheKey, JSON.stringify(data), FLIGHT_INFO_CACHE_TTL);
    return data;
  } catch (error: unknown) {
    console.error('Error fetching flight status:', error);
    return null;
  }
}

export async function getAirlineInfo(airlineIata: string): Promise<AirlineInfoResponse | null> {
  const cacheKey = `airline-info-${airlineIata}`;
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for airline info: ${cacheKey}`);
      return JSON.parse(cachedData) as AirlineInfoResponse;
    }

    // Similar to getFlightStatus, this direct fetch needs to be proxied via a Next.js API Route.
    const response: Response = await fetch(
      `http://api.aviationstack.com/v1/airlines?access_key=${env.AVIATIONSTACK_API_KEY}&iata_code=${airlineIata}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: AirlineInfoResponse = await response.json() as AirlineInfoResponse;
    await setCache(cacheKey, JSON.stringify(data), AIRLINE_INFO_CACHE_TTL);
    return data;
  } catch (error: unknown) {
    console.error('Error fetching airline info:', error);
    return null;
  }
}
