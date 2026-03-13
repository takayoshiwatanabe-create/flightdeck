import type { FlightInfo, FlightStatusType } from '../types/flight';
import { getFlightStatus, type FlightData } from './aviationstack';

/**
 * Mock flight data for development.
 * In production, this would proxy through a backend API to Aviationstack.
 * Direct client-to-Aviationstack calls are prohibited per spec (API key exposure).
 */

const MOCK_FLIGHTS: FlightInfo[] = [
  {
    flightIata: 'NH123',
    flightNumber: '123',
    airlineName: 'All Nippon Airways',
    airlineIata: 'NH',
    flightDate: '2026-03-13',
    status: 'scheduled',
    departure: {
      airport: 'Tokyo Haneda',
      iata: 'HND',
      terminal: '2',
      gate: '68',
      delay: null,
      scheduled: '2026-03-13T09:00:00Z',
      estimated: '2026-03-13T09:00:00Z',
      actual: null,
    },
    arrival: {
      airport: 'Osaka Itami',
      iata: 'ITM',
      terminal: '1',
      gate: null,
      delay: null,
      scheduled: '2026-03-13T10:15:00Z',
      estimated: '2026-03-13T10:15:00Z',
      actual: null,
    },
  },
  {
    flightIata: 'JL456',
    flightNumber: '456',
    airlineName: 'Japan Airlines',
    airlineIata: 'JL',
    flightDate: '2026-03-13',
    status: 'delayed',
    departure: {
      airport: 'Narita International',
      iata: 'NRT',
      terminal: '2',
      gate: '34A',
      delay: 25,
      scheduled: '2026-03-13T11:30:00Z',
      estimated: '2026-03-13T11:55:00Z',
      actual: null,
    },
    arrival: {
      airport: 'Los Angeles International',
      iata: 'LAX',
      terminal: 'B',
      gate: null,
      delay: null,
      scheduled: '2026-03-13T05:30:00Z',
      estimated: '2026-03-13T05:55:00Z',
      actual: null,
    },
  },
  {
    flightIata: 'UA789',
    flightNumber: '789',
    airlineName: 'United Airlines',
    airlineIata: 'UA',
    flightDate: '2026-03-13',
    status: 'active',
    departure: {
      airport: 'San Francisco International',
      iata: 'SFO',
      terminal: '3',
      gate: '87',
      delay: null,
      scheduled: '2026-03-13T01:00:00Z',
      estimated: '2026-03-13T01:00:00Z',
      actual: '2026-03-13T01:03:00Z',
    },
    arrival: {
      airport: 'Tokyo Narita',
      iata: 'NRT',
      terminal: '1',
      gate: null,
      delay: null,
      scheduled: '2026-03-14T05:00:00Z',
      estimated: '2026-03-14T04:50:00Z',
      actual: null,
    },
  },
  {
    flightIata: 'SQ12',
    flightNumber: '12',
    airlineName: 'Singapore Airlines',
    airlineIata: 'SQ',
    flightDate: '2026-03-13',
    status: 'landed',
    departure: {
      airport: 'Singapore Changi',
      iata: 'SIN',
      terminal: '3',
      gate: 'B12',
      delay: null,
      scheduled: '2026-03-12T23:55:00Z',
      estimated: '2026-03-12T23:55:00Z',
      actual: '2026-03-12T23:58:00Z',
    },
    arrival: {
      airport: 'Tokyo Narita',
      iata: 'NRT',
      terminal: '1',
      gate: '42',
      delay: null,
      scheduled: '2026-03-13T08:00:00Z',
      estimated: '2026-03-13T07:50:00Z',
      actual: '2026-03-13T07:48:00Z',
    },
  },
  {
    flightIata: 'CX500',
    flightNumber: '500',
    airlineName: 'Cathay Pacific',
    airlineIata: 'CX',
    flightDate: '2026-03-13',
    status: 'cancelled',
    departure: {
      airport: 'Hong Kong International',
      iata: 'HKG',
      terminal: '1',
      gate: null,
      delay: null,
      scheduled: '2026-03-13T14:00:00Z',
      estimated: null,
      actual: null,
    },
    arrival: {
      airport: 'Tokyo Haneda',
      iata: 'HND',
      terminal: '3',
      gate: null,
      delay: null,
      scheduled: '2026-03-13T19:30:00Z',
      estimated: null,
      actual: null,
    },
  },
];

/** Simulate API latency */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maps Aviationstack FlightData to our internal FlightInfo type.
 * @param data Aviationstack FlightData object.
 * @returns Mapped FlightInfo object.
 */
function mapAviationstackToFlightInfo(data: FlightData): FlightInfo {
  // Map Aviationstack status to our FlightStatusType, handling potential mismatches
  let status: FlightStatusType;
  switch (data.flight_status) {
    case 'scheduled':
    case 'active':
    case 'landed':
    case 'cancelled':
    case 'incident':
    case 'diverted':
    case 'delayed':
      status = data.flight_status as FlightStatusType;
      break;
    case 'departed': // Aviationstack specific status, map to 'active'
      status = 'active';
      break;
    default:
      status = 'scheduled'; // Default to scheduled if unknown
      console.warn(`Unknown flight status from Aviationstack: ${data.flight_status}. Defaulting to 'scheduled'.`);
  }

  return {
    flightIata: data.flight.iata,
    flightNumber: data.flight.number,
    airlineName: data.airline.name,
    airlineIata: data.airline.iata,
    flightDate: data.flight_date,
    status: status,
    departure: {
      airport: data.departure.airport,
      iata: data.departure.iata,
      terminal: data.departure.terminal,
      gate: data.departure.gate,
      delay: data.departure.delay,
      scheduled: data.departure.scheduled,
      estimated: data.departure.estimated,
      actual: data.departure.actual,
    },
    arrival: {
      airport: data.arrival.airport,
      iata: data.arrival.iata,
      terminal: data.arrival.terminal,
      gate: data.arrival.gate,
      delay: data.arrival.delay,
      scheduled: data.arrival.scheduled,
      estimated: data.arrival.estimated,
      actual: data.arrival.actual,
    },
  };
}

/** Search flights by number (mock implementation) */
export async function searchFlights(
  flightNumber: string,
  flightDate: string
): Promise<FlightInfo[]> {
  // In a real application, this would call a Next.js API route
  // which then calls getFlightStatus from src/lib/aviationstack.ts
  // For now, we'll use the mock data.
  await delay(800);

  const query = flightNumber.toUpperCase().trim();
  if (query.length === 0) return [];

  // Simulate filtering mock data
  const filteredFlights = MOCK_FLIGHTS.filter(
    (f) =>
      (f.flightIata.toUpperCase().includes(query) ||
      f.flightNumber.toUpperCase().includes(query) ||
      f.airlineIata.toUpperCase() === query) &&
      f.flightDate === flightDate // Filter by date as well
  );

  // If no mock flights match, try fetching from Aviationstack (simulated)
  if (filteredFlights.length === 0) {
    console.log(`No mock flights found for ${flightNumber} on ${flightDate}. Simulating Aviationstack API call.`);
    const aviationstackResponse = await getFlightStatus(flightNumber, flightDate);
    if (aviationstackResponse?.data && aviationstackResponse.data.length > 0) {
      return aviationstackResponse.data.map(mapAviationstackToFlightInfo);
    }
  }

  return filteredFlights;
}

/** Get flight details by IATA code (mock implementation) */
export async function getFlightByIata(
  flightIata: string,
  flightDate: string
): Promise<FlightInfo | null> {
  await delay(400);

  const foundMockFlight = MOCK_FLIGHTS.find(
    (f) => f.flightIata.toUpperCase() === flightIata.toUpperCase() && f.flightDate === flightDate
  );

  if (foundMockFlight) {
    return foundMockFlight;
  }

  // If not found in mock, simulate Aviationstack API call
  console.log(`No mock flight found for IATA ${flightIata} on ${flightDate}. Simulating Aviationstack API call.`);
  const aviationstackResponse = await getFlightStatus(flightIata, flightDate); // Assuming flightIata can be used as flight_number for simplicity here
  if (aviationstackResponse?.data && aviationstackResponse.data.length > 0) {
    return mapAviationstackToFlightInfo(aviationstackResponse.data[0]);
  }

  return null;
}

/** Get status label translation key */
export function getStatusKey(status: FlightStatusType): string {
  return `flight.status.${status}`;
}

