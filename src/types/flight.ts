// src/types/flight.ts
export type FlightStatusType =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'delayed'
  | 'diverted'
  | 'unknown';

export interface AirportInfo {
  airport: string;
  iata: string;
  terminal: string | null;
  gate: string | null;
  delay: number | null; // Delay in minutes
  scheduled: string; // ISO 8601 UTC string
  estimated: string; // ISO 8601 UTC string
  actual: string | null; // ISO 8601 UTC string
}

export interface FlightInfo {
  flightIata: string;
  flightNumber: string;
  airlineName: string;
  airlineIata: string;
  flightDate: string; // YYYY-MM-DD
  status: FlightStatusType;
  departure: AirportInfo;
  arrival: AirportInfo;
}

export const STATUS_COLORS: Record<FlightStatusType, string> = {
  scheduled: '#22D3EE', // Cyan
  active: '#34D399', // Emerald
  landed: '#6B7280', // Gray
  cancelled: '#6B7280', // Gray (not red as per spec)
  delayed: '#F59E0B', // Amber
  diverted: '#F59E0B', // Amber
  unknown: '#6B7280', // Gray
};

