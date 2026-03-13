// types/flight.ts
export type FlightStatusType =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'delayed'
  | 'cancelled'
  | 'incident'
  | 'diverted'
  | 'unknown';

export const STATUS_COLORS: Record<FlightStatusType, string> = {
  scheduled: '#22D3EE', // Cyan
  active: '#34D399', // Emerald
  landed: '#6B7280', // Gray
  delayed: '#F59E0B', // Amber
  cancelled: '#6B7280', // Gray (as per spec, not red)
  incident: '#EF4444', // Red (for severe issues)
  diverted: '#F59E0B', // Amber
  unknown: '#6B7280', // Gray
};

export interface AirportInfo {
  iata: string;
  airport: string;
  timezone: string;
  scheduled: string | null; // UTC ISO string
  estimated: string | null; // UTC ISO string
  actual: string | null; // UTC ISO string
  terminal: string | null;
  gate: string | null;
  delay: number | null; // in minutes
}

export interface FlightInfo {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD
  airlineName: string;
  departure: AirportInfo;
  arrival: AirportInfo;
  status: FlightStatusType;
}

