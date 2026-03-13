// This file will contain functions for fetching flight data.
// For now, these are mock implementations.

import { type FlightInfo, type FlightStatusType } from '@/types/flight';
import { format } from 'date-fns';

// Mock data for demonstration
const mockFlights: FlightInfo[] = [
  {
    flightIata: 'JL123',
    flightDate: '2024-07-20',
    airlineName: 'Japan Airlines',
    departure: {
      iata: 'HND',
      airport: 'Haneda Airport',
      timezone: 'Asia/Tokyo',
      scheduled: '2024-07-20T10:00:00Z',
      estimated: '2024-07-20T10:00:00Z',
      actual: null,
      terminal: '1',
      gate: 'A12',
      delay: 0,
    },
    arrival: {
      iata: 'ITM',
      airport: 'Osaka International Airport',
      timezone: 'Asia/Tokyo',
      scheduled: '2024-07-20T11:15:00Z',
      estimated: '2024-07-20T11:15:00Z',
      actual: null,
      terminal: 'B',
      gate: '15',
      delay: 0,
    },
    status: 'scheduled',
  },
  {
    flightIata: 'NH456',
    flightDate: '2024-07-20',
    airlineName: 'ANA',
    departure: {
      iata: 'NRT',
      airport: 'Narita International Airport',
      timezone: 'Asia/Tokyo',
      scheduled: '2024-07-20T14:30:00Z',
      estimated: '2024-07-20T14:45:00Z',
      actual: null,
      terminal: '2',
      gate: 'C30',
      delay: 15,
    },
    arrival: {
      iata: 'FUK',
      airport: 'Fukuoka Airport',
      timezone: 'Asia/Tokyo',
      scheduled: '2024-07-20T16:30:00Z',
      estimated: '2024-07-20T16:45:00Z',
      actual: null,
      terminal: null,
      gate: null,
      delay: 15,
    },
    status: 'delayed',
  },
  {
    flightIata: 'AA789',
    flightDate: '2024-07-20',
    airlineName: 'American Airlines',
    departure: {
      iata: 'LAX',
      airport: 'Los Angeles International Airport',
      timezone: 'America/Los_Angeles',
      scheduled: '2024-07-20T08:00:00Z',
      estimated: '2024-07-20T08:00:00Z',
      actual: '2024-07-20T08:05:00Z',
      terminal: 'T4',
      gate: '45',
      delay: 5,
    },
    arrival: {
      iata: 'JFK',
      airport: 'John F. Kennedy International Airport',
      timezone: 'America/New_York',
      scheduled: '2020-07-20T17:00:00Z',
      estimated: '2020-07-20T17:05:00Z',
      actual: '2020-07-20T17:02:00Z',
      terminal: 'T8',
      gate: '10',
      delay: 2,
    },
    status: 'landed',
  },
  {
    flightIata: 'UA001',
    flightDate: '2024-07-20',
    airlineName: 'United Airlines',
    departure: {
      iata: 'ORD',
      airport: 'O\'Hare International Airport',
      timezone: 'America/Chicago',
      scheduled: '2024-07-20T09:00:00Z',
      estimated: null,
      actual: null,
      terminal: '1',
      gate: 'B10',
      delay: null,
    },
    arrival: {
      iata: 'SFO',
      airport: 'San Francisco International Airport',
      timezone: 'America/Los_Angeles',
      scheduled: '2024-07-20T11:30:00Z',
      estimated: null,
      actual: null,
      terminal: '3',
      gate: 'F15',
      delay: null,
    },
    status: 'cancelled',
  },
];

export async function searchFlights(flightNumber: string, flightDate: string): Promise<FlightInfo[]> {
  console.log(`Searching for flight ${flightNumber} on ${flightDate}`);
  // Simulate API call delay
  await new Promise<void>(resolve => { setTimeout(resolve, 1500); });

  const normalizedFlightNumber = flightNumber.toUpperCase();
  const normalizedFlightDate = format(new Date(flightDate), 'yyyy-MM-dd');

  const results = mockFlights.filter(
    (flight) =>
      flight.flightIata.includes(normalizedFlightNumber) &&
      flight.flightDate === normalizedFlightDate
  );

  if (results.length === 0) {
    console.log('No flights found for:', flightNumber, flightDate);
  } else {
    console.log('Found flights:', results);
  }

  return results;
}

export async function fetchFlightDetails(flightIata: string, flightDate: string): Promise<FlightInfo | null> {
  console.log(`Fetching details for flight ${flightIata} on ${flightDate}`);
  // Simulate API call delay
  await new Promise<void>(resolve => { setTimeout(resolve, 1000); });

  const normalizedFlightDate = format(new Date(flightDate), 'yyyy-MM-dd');

  const flight = mockFlights.find(
    (f) => f.flightIata === flightIata && f.flightDate === normalizedFlightDate
  );

  if (!flight) {
    console.log('Flight details not found for:', flightIata, flightDate);
  } else {
    console.log('Fetched flight details:', flight);
  }

  return flight || null;
}

// Helper to map API status to i18n key
export function getStatusKey(status: FlightStatusType): string {
  switch (status) {
    case 'scheduled':
      return 'status.scheduled';
    case 'active':
      return 'status.active';
    case 'landed':
      return 'status.landed';
    case 'delayed':
      return 'status.delayed';
    case 'cancelled':
      return 'status.cancelled';
    case 'incident':
      return 'status.incident';
    case 'diverted':
      return 'status.diverted';
    default:
      return 'status.unknown';
  }
}

