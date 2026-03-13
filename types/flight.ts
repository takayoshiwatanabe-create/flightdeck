/**
 * Defines the possible statuses for a flight.
 * These are based on Aviationstack API documentation.
 */
export type FlightStatusType =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'delayed'
  | 'incident'
  | 'diverted'
  | 'unknown'; // Added 'unknown' to cover all possible API responses

/**
 * Defines the color mapping for different flight statuses.
 * Colors are based on the project's UX/Design principles (e.g., amber for delay, gray for cancelled).
 */
export const STATUS_COLORS: Record<FlightStatusType, string> = {
  scheduled: '#22D3EE', // Cyan
  active: '#34D399', // Emerald
  landed: '#6B7280', // Gray
  cancelled: '#6B7280', // Gray (not red, per spec)
  delayed: '#F59E0B', // Amber
  incident: '#EF4444', // Red (for critical incidents)
  diverted: '#F59E0B', // Amber (similar to delayed)
  unknown: '#6B7280', // Gray for unknown status
};

/**
 * Represents airport information for departure or arrival.
 */
export interface AirportInfo {
  airport: string;
  iata: string;
  terminal: string | null;
  gate: string | null;
  delay: number | null; // Delay in minutes
  scheduled: string; // UTC ISO string
  estimated: string | null; // UTC ISO string
  actual: string | null; // UTC ISO string
}

/**
 * Represents a single flight's information.
 */
export interface FlightInfo {
  flightIata: string; // e.g., "NH123"
  flightNumber: string; // e.g., "123"
  airlineName: string;
  airlineIata: string;
  flightDate: string; // YYYY-MM-DD format
  status: FlightStatusType;
  departure: AirportInfo;
  arrival: AirportInfo;
}

/**
 * Represents a tracked flight stored locally.
 */
export interface TrackedFlight {
  flightIata: string;
  flightDate: string; // YYYY-MM-DD
  trackedAt: string; // ISO string
}

