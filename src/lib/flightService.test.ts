import { searchFlights, fetchFlightDetails, getStatusKey } from './flightService';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Mock external dependencies
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(() => ({
    limit: jest.fn(() => Promise.resolve({ success: true, pending: Promise.resolve() })),
  })),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('flightService', () => {
  const mockRedis = new Redis({ url: 'mock-url', token: 'mock-token' });
  const mockRatelimit = new Ratelimit({
    redis: mockRedis,
    limiter: Ratelimit.fixedWindow(10, '10s'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (Redis as jest.Mock).mockClear();
    (Ratelimit as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockClear();

    // Reset mock implementations for each test
    (mockRedis.get as jest.Mock).mockResolvedValue(null);
    (mockRedis.set as jest.Mock).mockResolvedValue('OK');
    (mockRatelimit.limit as jest.Mock).mockResolvedValue({ success: true, pending: Promise.resolve() });
  });

  describe('searchFlights', () => {
    const mockFlightNumber = 'JL123';
    const mockFlightDate = '2024-07-20';
    const mockApiResponse = {
      data: [
        {
          flight: { iata: mockFlightNumber },
          airline: { name: 'JAL' },
          flight_date: mockFlightDate,
          flight_status: 'scheduled',
          departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00.000Z' },
          arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00.000Z' },
        },
      ],
    };

    it('should fetch flights from API and cache them', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const flights = await searchFlights(mockFlightNumber, mockFlightDate);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/flights/search?flight_number=${mockFlightNumber}&flight_date=${mockFlightDate}`),
        expect.any(Object)
      );
      expect(flights).toHaveLength(1);
      expect(flights[0].flightIata).toBe(mockFlightNumber);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `flight_search:${mockFlightNumber}:${mockFlightDate}`,
        JSON.stringify(flights),
        { ex: 3600 }
      );
    });

    it('should return cached flights if available', async () => {
      const cachedFlights = [
        {
          flightIata: mockFlightNumber,
          airlineName: 'JAL',
          flightDate: mockFlightDate,
          status: 'scheduled',
          departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00Z' },
          arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00Z' },
        },
      ];
      (mockRedis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedFlights));

      const flights = await searchFlights(mockFlightNumber, mockFlightDate);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(flights).toEqual(cachedFlights);
    });

    it('should throw an error if API call fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      });

      await expect(searchFlights(mockFlightNumber, mockFlightDate)).rejects.toThrow('Failed to fetch flight data');
    });

    it('should throw an error if rate limit is exceeded', async () => {
      (mockRatelimit.limit as jest.Mock).mockResolvedValueOnce({ success: false, pending: Promise.resolve() });

      await expect(searchFlights(mockFlightNumber, mockFlightDate)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('fetchFlightDetails', () => {
    const mockFlightIata = 'JL123';
    const mockFlightDate = '2024-07-20';
    const mockApiResponse = {
      data: [
        {
          flight: { iata: mockFlightIata },
          airline: { name: 'JAL' },
          flight_date: mockFlightDate,
          flight_status: 'scheduled',
          departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00.000Z' },
          arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00.000Z' },
        },
      ],
    };

    it('should fetch flight details from API and cache them', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const flight = await fetchFlightDetails(mockFlightIata, mockFlightDate);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/flights/details?flight_iata=${mockFlightIata}&flight_date=${mockFlightDate}`),
        expect.any(Object)
      );
      expect(flight?.flightIata).toBe(mockFlightIata);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `flight_details:${mockFlightIata}:${mockFlightDate}`,
        JSON.stringify(flight),
        { ex: 60 }
      );
    });

    it('should return cached flight details if available', async () => {
      const cachedFlight = {
        flightIata: mockFlightIata,
        airlineName: 'JAL',
        flightDate: mockFlightDate,
        status: 'scheduled',
        departure: { iata: 'HND', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T10:00:00Z' },
        arrival: { iata: 'ITM', timezone: 'Asia/Tokyo', scheduled: '2024-07-20T11:00:00Z' },
      };
      (mockRedis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedFlight));

      const flight = await fetchFlightDetails(mockFlightIata, mockFlightDate);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(flight).toEqual(cachedFlight);
    });

    it('should return null if API returns no data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const flight = await fetchFlightDetails(mockFlightIata, mockFlightDate);

      expect(flight).toBeNull();
    });

    it('should throw an error if API call fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      });

      await expect(fetchFlightDetails(mockFlightIata, mockFlightDate)).rejects.toThrow('Failed to fetch flight details');
    });

    it('should throw an error if rate limit is exceeded', async () => {
      (mockRatelimit.limit as jest.Mock).mockResolvedValueOnce({ success: false, pending: Promise.resolve() });

      await expect(fetchFlightDetails(mockFlightIata, mockFlightDate)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('getStatusKey', () => {
    it('should return correct translation key for known statuses', () => {
      expect(getStatusKey('scheduled')).toBe('status.scheduled');
      expect(getStatusKey('active')).toBe('status.active');
      expect(getStatusKey('landed')).toBe('status.landed');
      expect(getStatusKey('cancelled')).toBe('status.cancelled');
      expect(getStatusKey('incident')).toBe('status.incident');
      expect(getStatusKey('diverted')).toBe('status.diverted');
    });

    it('should return "status.unknown" for unknown statuses', () => {
      expect(getStatusKey('unknown_status' as any)).toBe('status.unknown');
      expect(getStatusKey(null as any)).toBe('status.unknown');
      expect(getStatusKey(undefined as any)).toBe('status.unknown');
    });
  });
});

