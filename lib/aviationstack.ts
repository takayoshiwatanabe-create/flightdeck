import { format } from 'date-fns';
import { type FlightInfo, type FlightStatusType } from '@/types/flight';

// This file would contain the logic to interact with the Aviationstack API.
// Per the project constitution, direct client-side access is prohibited.
// This is a placeholder for a server-side API route.

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

interface AviationstackFlightResponse {
  data: Array<{
    flight_date: string; // YYYY-MM-DD
    flight_status: string; // "scheduled", "active", "landed", "cancelled", "delayed"
    departure: {
      airport: string;
      timezone: string;
      iata: string;
      icao: string;
      terminal: string | null;
      gate: string | null;
      delay: number | null; // minutes
      scheduled: string; // UTC ISO string
      estimated: string; // UTC ISO string
      actual: string | null; // UTC ISO string
      // other fields omitted for brevity
    };
    arrival: {
      airport: string;
      timezone: string;
      iata: string;
      icao: string;
      terminal: string | null;
      gate: string | null;
      delay: number | null; // minutes
      scheduled: string; // UTC ISO string
      estimated: string; // UTC ISO string
      actual: string | null; // UTC ISO string
      // other fields omitted for brevity
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
    };
  }>;
}

function mapStatus(status: string): FlightStatusType {
  switch (status) {
    case 'scheduled':
      return 'scheduled';
    case 'active':
      return 'active';
    case 'landed':
      return 'landed';
    case 'cancelled':
      return 'cancelled';
    case 'delayed':
      return 'delayed';
    default:
      return 'scheduled'; // Default to scheduled for unknown statuses
  }
}

/**
 * Fetches flight information from Aviationstack API.
 * This function is intended to be called from a Next.js API Route (server-side).
 * @param flightIata The IATA code of the flight (e.g., "NH123").
 * @param flightDate The date of the flight in YYYY-MM-DD format.
 * @returns A Promise that resolves to FlightInfo or null if not found.
 */
export async function fetchFlightFromAviationstack(
  flightIata: string,
  flightDate: string
): Promise<FlightInfo | null> {
  if (!AVIATIONSTACK_API_KEY) {
    console.error('AVIATIONSTACK_API_KEY is not set.');
    throw new Error('Server configuration error: Aviationstack API key missing.');
  }

  const url = new URL(`${AVIATIONSTACK_BASE_URL}/flights`);
  url.searchParams.append('access_key', AVIATIONSTACK_API_KEY);
  url.searchParams.append('flight_iata', flightIata);
  url.searchParams.append('flight_date', flightDate);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add caching headers if using Vercel KV or other caching layer
      // 'Cache-Control': 's-maxage=60, stale-while-revalidate',
    });

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch flight data: ${response.statusText}`);
    }

    const data: AviationstackFlightResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      return null; // Flight not found
    }

    // Assuming the first result is the most relevant
    const flightData = data.data[0];

    // Data Integrity: Ensure all times are treated as UTC
    const departureScheduledUTC = flightData.departure.scheduled;
    const departureEstimatedUTC = flightData.departure.estimated;
    const departureActualUTC = flightData.departure.actual;

    const arrivalScheduledUTC = flightData.arrival.scheduled;
    const arrivalEstimatedUTC = flightData.arrival.estimated;
    const arrivalActualUTC = flightData.arrival.actual;

    const flightInfo: FlightInfo = {
      flightIata: flightData.flight.iata,
      flightNumber: flightData.flight.number,
      airlineName: flightData.airline.name,
      airlineIata: flightData.airline.iata,
      flightDate: flightData.flight_date,
      status: mapStatus(flightData.flight_status),
      departure: {
        airport: flightData.departure.airport,
        iata: flightData.departure.iata,
        terminal: flightData.departure.terminal,
        gate: flightData.departure.gate,
        delay: flightData.departure.delay,
        scheduled: departureScheduledUTC,
        estimated: departureEstimatedUTC,
        actual: departureActualUTC,
      },
      arrival: {
        airport: flightData.arrival.airport,
        iata: flightData.arrival.iata,
        terminal: flightData.arrival.terminal,
        gate: flightData.arrival.gate,
        delay: flightData.arrival.delay,
        scheduled: arrivalScheduledUTC,
        estimated: arrivalEstimatedUTC,
        actual: arrivalActualUTC,
      },
    };

    return flightInfo;
  } catch (error: unknown) {
    console.error('Error fetching flight from Aviationstack:', error);
    throw error; // Re-throw to be handled by the caller
  }
}
