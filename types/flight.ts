export type FlightStatusType =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'delayed';

export const STATUS_COLORS: Record<FlightStatusType, string> = {
  scheduled: '#22D3EE', // Cyan
  active: '#34D399', // Emerald
  landed: '#6B7280', // Gray
  delayed: '#F59E0B', // Amber
  cancelled: '#6B7280', // Gray (not red, as per spec)
};

export interface FlightLeg {
  airport: string;
  iata: string;
  terminal: string | null;
  gate: string | null;
  delay: number | null; // in minutes
  scheduled: string; // UTC ISO string
  estimated: string; // UTC ISO string
  actual: string | null; // UTC ISO string
  timezone: string; // IANA timezone name, e.g., "America/New_York"
}

export interface FlightInfo {
  flightIata: string; // e.g., "NH123"
  flightNumber: string; // e.g., "123"
  airlineName: string;
  airlineIata: string;
  flightDate: string; // YYYY-MM-DD
  status: FlightStatusType;
  departure: FlightLeg;
  arrival: FlightLeg;
}

