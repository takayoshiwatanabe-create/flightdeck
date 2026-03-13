import { env } from './env';
import { getCache, setCache } from './kv'; // Import KV functions
import { formatInTimeZone, toDate } from 'date-fns-tz'; // For UTC conversion if needed
import { parseISO } from 'date-fns';

// Define a common interface for flight data structure
export interface FlightData {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string; // e.g., "America/New_York"
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    delay: number | null; // in minutes
    scheduled: string; // UTC datetime string (e.g., "2026-03-13T09:00:00.000Z")
    estimated: string; // UTC datetime string
    actual: string | null; // UTC datetime string
    revised: string | null; // UTC datetime string
  };
  arrival: {
    airport: string;
    timezone: string; // e.g., "Asia/Tokyo"
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null; // in minutes
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
 * Normalizes a date string to UTC.
 * If the input date string is already in UTC (ends with 'Z'), it's returned as is.
 * Otherwise, it's assumed to be in a local timezone and converted to UTC.
 * This is a safeguard; Aviationstack usually provides UTC.
 * @param dateString The date string to normalize.
 * @param timezone The IANA timezone string (e.g., "America/New_York") if the dateString is local.
 * @returns A UTC date string.
 */
function normalizeToUTC(dateString: string, timezone: string = 'UTC'): string {
  // Check if dateString is already in ISO format with 'Z' or timezone offset
  if (dateString.endsWith('Z') || /[-+]\d{2}:\d{2}$/.test(dateString)) {
    return parseISO(dateString).toISOString(); // Parse and re-format to ensure standard UTC ISO
  }
  // If no timezone info, assume it's local to the provided timezone and convert to UTC
  try {
    // toDate parses the dateString in the given timezone, then toISOString converts it to UTC.
    return toDate(dateString, { timeZone: timezone }).toISOString();
  } catch (e: unknown) {
    console.warn(`Could not parse dateString "${dateString}" with timezone "${timezone}". Falling back to direct parse. Error:`, e);
    // Fallback if timezone parsing fails, assume it's already UTC or can be parsed as such
    return parseISO(dateString).toISOString();
  }
}

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
      return JSON.parse(cachedData) as FlightStatusResponse;
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

    const data: FlightStatusResponse = await response.json() as FlightStatusResponse;
    // Normalize all date/time strings to UTC immediately upon reception.
    // Aviationstack API generally returns UTC, but this ensures Data Integrity (1.3).
    data.data.forEach(flight => {
      // Departure times
      if (flight.departure.scheduled) flight.departure.scheduled = normalizeToUTC(flight.departure.scheduled, flight.departure.timezone);
      if (flight.departure.estimated) flight.departure.estimated = normalizeToUTC(flight.departure.estimated, flight.departure.timezone);
      if (flight.departure.actual) flight.departure.actual = normalizeToUTC(flight.departure.actual, flight.departure.timezone);
      if (flight.departure.revised) flight.departure.revised = normalizeToUTC(flight.departure.revised, flight.departure.timezone);

      // Arrival times
      if (flight.arrival.scheduled) flight.arrival.scheduled = normalizeToUTC(flight.arrival.scheduled, flight.arrival.timezone);
      if (flight.arrival.estimated) flight.arrival.estimated = normalizeToUTC(flight.arrival.estimated, flight.arrival.timezone);
      if (flight.arrival.actual) flight.arrival.actual = normalizeToUTC(flight.arrival.actual, flight.arrival.timezone);
      if (flight.arrival.revised) flight.arrival.revised = normalizeToUTC(flight.arrival.revised, flight.arrival.timezone);

      // Live update time
      if (flight.live?.updated) flight.live.updated = normalizeToUTC(flight.live.updated);
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
      return JSON.parse(cachedData) as AirlineInfoResponse;
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

    const data: AirlineInfoResponse = await response.json() as AirlineInfoResponse;
    await setCache(cacheKey, JSON.stringify(data), AIRLINE_INFO_CACHE_TTL);
    return data;
  } catch (error: unknown) {
    console.error('Error fetching airline info:', error);
    return null;
  }
}

