import { getCache, setCache } from './kv';
import { env } from './env';
import { type FlightInfo, type FlightStatus } from '@/types/flight';
import { parseISO, formatISO } from 'date-fns';

// Helper to normalize any date string to UTC ISO string
function normalizeToUTC(dateString: string): string {
  // Attempt to parse with date-fns, then format to UTC ISO string
  try {
    const date = parseISO(dateString);
    return formatISO(date, { representation: 'complete', fractionalDigits: 3 }).replace('+00:00', 'Z');
  } catch (error: unknown) {
    console.warn(`Failed to parse or normalize date string to UTC: ${dateString}`, error);
    // Fallback to original string if parsing fails, or handle as appropriate
    return dateString;
  }
}

// Aviationstack API types (simplified for relevant fields)
interface AviationstackFlight {
  flight_date: string; // YYYY-MM-DD
  flight_status: string; // e.g., "scheduled", "active", "landed", "cancelled", "incident", "diverted", "delayed"
  flight: {
    iata: string;
    number: string;
  };
  airline: {
    name: string;
    iata_code: string;
  };
  departure: {
    airport: string;
    iata: string;
    scheduled: string; // ISO 8601 string, e.g., "2024-07-20T10:00:00.000Z"
    estimated: string; // ISO 8601 string
    actual: string | null; // ISO 8601 string
    delay: number | null; // minutes
    terminal: string | null;
    gate: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string; // ISO 8601 string
    estimated: string; // ISO 8601 string
    actual: string | null; // ISO 8601 string
    delay: number | null; // minutes
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
  };
}

interface AviationstackResponse {
  data: AviationstackFlight[];
}

const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';
const FLIGHT_CACHE_TTL = 60; // 60 seconds
const AIRLINE_CACHE_TTL = 24 * 60 * 60; // 24 hours

/**
 * Aviationstack APIからフライト情報を取得します。
 * @param flightIata フライトIATAコード (例: NH123)
 * @param flightDate フライト日付 (YYYY-MM-DD)
 * @returns FlightInfo[] または null
 */
export async function getFlightStatus(flightIata: string, flightDate: string): Promise<FlightInfo[] | null> {
  const cacheKey = `flight:${flightIata}:${flightDate}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    console.log(`Cache hit for flight ${flightIata} on ${flightDate}`);
    return JSON.parse(cachedData) as FlightInfo[];
  }

  try {
    const response = await fetch(
      `${AVIATIONSTACK_BASE_URL}/flights?access_key=${env.AVIATIONSTACK_API_KEY}&flight_iata=${flightIata}&flight_date=${flightDate}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as AviationstackResponse;

    if (!data.data || data.data.length === 0) {
      return [];
    }

    const flights: FlightInfo[] = data.data.map((apiFlight) => ({
      flightIata: apiFlight.flight.iata,
      flightNumber: apiFlight.flight.number,
      flightDate: apiFlight.flight_date,
      airlineName: apiFlight.airline.name,
      status: apiFlight.flight_status as FlightStatus, // Type assertion based on known statuses
      departure: {
        airport: apiFlight.departure.airport,
        iata: apiFlight.departure.iata,
        scheduled: normalizeToUTC(apiFlight.departure.scheduled),
        estimated: normalizeToUTC(apiFlight.departure.estimated),
        actual: apiFlight.departure.actual ? normalizeToUTC(apiFlight.departure.actual) : null,
        delay: apiFlight.departure.delay,
        terminal: apiFlight.departure.terminal,
        gate: apiFlight.departure.gate,
      },
      arrival: {
        airport: apiFlight.arrival.airport,
        iata: apiFlight.arrival.iata,
        scheduled: normalizeToUTC(apiFlight.arrival.scheduled),
        estimated: normalizeToUTC(apiFlight.arrival.estimated),
        actual: apiFlight.arrival.actual ? normalizeToUTC(apiFlight.arrival.actual) : null,
        delay: apiFlight.arrival.delay,
        terminal: apiFlight.arrival.terminal,
        gate: apiFlight.arrival.gate,
        baggage: apiFlight.arrival.baggage,
      },
    }));

    await setCache(cacheKey, JSON.stringify(flights), FLIGHT_CACHE_TTL);
    return flights;
  } catch (error: unknown) {
    console.error(`Error fetching flight status for ${flightIata} on ${flightDate}:`, error);
    return null;
  }
}

/**
 * Aviationstack APIから航空会社情報を取得します。
 * @param airlineIata 航空会社IATAコード
 * @returns 航空会社名またはnull
 */
export async function getAirlineInfo(airlineIata: string): Promise<string | null> {
  const cacheKey = `airline:${airlineIata}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    console.log(`Cache hit for airline ${airlineIata}`);
    return cachedData;
  }

  try {
    const response = await fetch(
      `${AVIATIONSTACK_BASE_URL}/airlines?access_key=${env.AVIATIONSTACK_API_KEY}&airline_iata=${airlineIata}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as { data: Array<{ airline_name: string }> };

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const airlineName = data.data[0].airline_name;
    await setCache(cacheKey, airlineName, AIRLINE_CACHE_TTL);
    return airlineName;
  } catch (error: unknown) {
    console.error(`Error fetching airline info for ${airlineIata}:`, error);
    return null;
  }
}
