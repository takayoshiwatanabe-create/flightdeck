import '@testing-library/react-native/extend-expect';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react-native';

// Mock AsyncStorage for React Native environment
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock window.location for web platform tests
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

beforeAll(() => {
  // Store original window.location
  Object.defineProperty(window, 'location', {
    writable: true,
    value: mockLocation,
  });
});

afterEach(() => {
  cleanup(); // Cleans up the DOM after each test
  vi.clearAllMocks(); // Clears all mocks after each test
  // Reset window.location.href after each test
  mockLocation.href = '';
});

afterAll(() => {
  // Restore original window.location if necessary, though Vitest usually handles global state well
});

