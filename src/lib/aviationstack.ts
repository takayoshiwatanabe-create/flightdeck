// This file is a placeholder for backend API interaction with Aviationstack.
// Per spec, client should not directly access Aviationstack.
// This file should ideally live in a `src/api` or `src/server` directory
// and be called from Next.js API Routes (Route Handlers).

import { type FlightInfo, type FlightStatusType } from '@/types/flight';
// No need to import format from date-fns here as it's not used in this file.

// In a real application, this API key would be stored securely as an environment variable
// and only accessed on the server-side.
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY ?? 'YOUR_AVIATIONSTACK_API_KEY';
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

/**
 * Fetches flight data from Aviationstack API.
 * This is a server-side function and should not be called directly from the client.
 *
 * @param flightIata The IATA flight number (e.g., "NH123").
 * @param flightDate The date of the flight in YYYY-MM-DD format.
 * @returns A promise that resolves to an array of FlightInfo or an empty array.
 */
export async function fetchFlightData(
  flightIata: string,
  flightDate: string
): Promise<FlightInfo[]> {
  if (!AVIATIONSTACK_API_KEY || AVIATIONSTACK_API_KEY === 'YOUR_AVIATIONSTACK_API_KEY') {
    console.warn('Aviationstack API key is not configured. Using mock data.');
    return []; // Return empty array if API key is not set
  }

  try {
    const response = await fetch(
      `${AVIATIONSTACK_BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${flightIata}&flight_date=${flightDate}`
    );

    if (!response.ok) {
      console.error(`Aviationstack API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as { data: unknown[] }; // Simplified type for initial parsing

    if (!data || !Array.isArray(data.data)) {
      console.warn('Aviationstack API returned unexpected data format.');
      return [];
    }

    // Map API response to FlightInfo type
    const flights: FlightInfo[] = data.data.map((item: any) => ({
      flightIata: item.flight.iata,
      flightNumber: item.flight.number,
      airlineName: item.airline.name,
      airlineIata: item.airline.iata,
      flightDate: item.flight_date,
      status: item.flight_status as FlightStatusType,
      departure: {
        airport: item.departure.airport,
        iata: item.departure.iata,
        terminal: item.departure.terminal,
        gate: item.departure.gate,
        delay: item.departure.delay,
        scheduled: item.departure.scheduled,
        estimated: item.departure.estimated,
        actual: item.departure.actual,
      },
      arrival: {
        airport: item.arrival.airport,
        iata: item.arrival.iata,
        terminal: item.arrival.terminal,
        gate: item.arrival.gate,
        delay: item.arrival.delay,
        scheduled: item.arrival.scheduled,
        estimated: item.arrival.estimated,
        actual: item.arrival.actual,
      },
    }));

    return flights;
  } catch (error: unknown) {
    console.error('Error fetching flight data from Aviationstack:', error);
    return [];
  }
}

/**
 * Fetches flight details for a specific flight IATA and date.
 *
 * @param flightIata The IATA flight number.
 * @param flightDate The date of the flight.
 * @returns A single FlightInfo object or null if not found.
 */
export async function fetchFlightDetails(
  flightIata: string,
  flightDate: string
): Promise<FlightInfo | null> {
  const flights = await fetchFlightData(flightIata, flightDate);
  return flights.length > 0 ? flights[0] : null;
}
