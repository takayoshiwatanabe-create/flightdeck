/** Flight status values per spec color system */
export type FlightStatusType =
  | 'scheduled'   // 定刻: Cyan #22D3EE
  | 'active'      // 搭乗中: Emerald #34D399
  | 'landed'      // 到着済み: Gray #6B7280
  | 'cancelled'   // 欠航: Gray #6B7280 (NOT red per spec)
  | 'incident'
  | 'diverted'
  | 'delayed';    // 遅延: Amber #F59E0B

/** Status color mapping per spec section 8.2 */
export const STATUS_COLORS: Record<FlightStatusType, string> = {
  scheduled: '#22D3EE',  // Cyan
  active: '#34D399',     // Emerald
  landed: '#6B7280',     // Gray
  cancelled: '#6B7280',  // Gray (red prohibited)
  incident: '#F59E0B',   // Amber
  diverted: '#F59E0B',   // Amber
  delayed: '#F59E0B',    // Amber
};

export interface AirportInfo {
  airport: string;
  iata: string;
  terminal: string | null;
  gate: string | null;
  delay: number | null;
  scheduled: string; // UTC ISO string
  estimated: string | null; // UTC ISO string
  actual: string | null; // UTC ISO string
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

/** A flight saved by the user to track */
export interface TrackedFlight {
  flightIata: string;
  flightDate: string;
  addedAt: string; // UTC ISO string
}

