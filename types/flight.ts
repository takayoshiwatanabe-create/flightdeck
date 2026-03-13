export type FlightStatusType = 'scheduled' | 'active' | 'landed' | 'cancelled' | 'delayed';

export const STATUS_COLORS: Record<FlightStatusType, string> = {
  scheduled: '#22D3EE', // Cyan
  active: '#34D399', // Emerald
  landed: '#6B7280', // Gray
  cancelled: '#6B7280', // Gray (as per constitution, not red)
  delayed: '#F59E0B', // Amber
};

export interface AirportInfo {
  airport: string;
  iata: string;
  terminal: string | null;
  gate: string | null;
  delay: number | null; // in minutes
  scheduled: string; // UTC ISO string
  estimated: string | null; // UTC ISO string
  actual: string | null; // UTC ISO string
  timezone: string; // IANA timezone string (e.g., "America/New_York")
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
