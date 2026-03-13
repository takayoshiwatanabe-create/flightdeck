// src/types/flight.ts
export type FlightStatus =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'incident'
  | 'diverted'
  | 'delayed';

export interface FlightInfo {
  flightIata: string;
  flightNumber: string;
  flightDate: string; // YYYY-MM-DD
  airlineName: string;
  status: FlightStatus;
  departure: {
    airport: string;
    iata: string;
    scheduled: string; // UTC ISO string
    estimated: string; // UTC ISO string
    actual: string | null; // UTC ISO string
    delay: number | null; // minutes
    terminal: string | null;
    gate: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string; // UTC ISO string
    estimated: string; // UTC ISO string
    actual: string | null; // UTC ISO string
    delay: number | null; // minutes
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
  };
}

// Constitution (Project Rules) 第8条2項 カラーシステムに準拠
export const STATUS_COLORS: Record<FlightStatus, string> = {
  scheduled: '#22D3EE', // シアン
  active: '#34D399',    // エメラルド
  landed: '#6B7280',    // グレー
  cancelled: '#6B7280', // グレー
  incident: '#EF4444',  // 赤 (緊急事態のため例外的に赤を許可)
  diverted: '#F59E0B',  // アンバー
  delayed: '#F59E0B',   // アンバー
};
