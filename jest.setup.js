import '@testing-library/react-native/extend-expect';
import { TextEncoder, TextDecoder } from 'util';

// Mock `next-intl` for all tests
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => (key, params) => {
    let message = `${namespace}.${key}`;
    if (params) {
      message += ` ${JSON.stringify(params)}`;
    }
    return message;
  }),
  useLocale: jest.fn(() => 'en'),
  // Mock `createTranslator` if used in server components or tests that need it
  createTranslator: jest.fn(() => ({
    t: (key, params) => {
      let message = `mocked.server.${key}`;
      if (params) {
        message += ` ${JSON.stringify(params)}`;
      }
      return message;
    },
  })),
}));

// Mock `expo-router` for all tests
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Link: jest.fn().mockImplementation(({ children, href, ...props }) =>
    <mock-link href={href} {...props}>{children}</mock-link>
  ),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
  Tabs: {
    Screen: jest.fn(({ options }) => <mock-tab-screen title={options.title} />),
  },
}));

// Mock `react-native-gesture-handler`
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    /* Buttons */
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    /* Other */
    FlatList: View,
    Switch: View,
    TextInput: View,
    ScrollView: View,
    Slider: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
  };
});

// Mock `react-native-reanimated`
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock `expo-localization`
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => ([{ languageCode: 'en', textDirection: 'ltr' }])),
}));

// Mock `expo-constants`
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'mock-project-id',
        },
      },
    },
  },
}));

// Mock `react-native-safe-area-context`
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock `react-native-screens`
jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  actual.enableScreens();
  return actual;
});

// Mock `AsyncStorage` from `@react-native-async-storage/async-storage`
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// Mock `Platform` for React Native specific code
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios', // Default to iOS for tests, can be overridden per test
  select: jest.fn((options) => options.ios),
}));

// Mock `TextEncoder` and `TextDecoder` for environments where they might be missing (e.g., older Node.js versions or specific Jest setups)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock `window.location.href` for web platform redirects
const mockWindowLocation = {
  href: '',
  assign: jest.fn((url) => { mockWindowLocation.href = url; }),
  replace: jest.fn((url) => { mockWindowLocation.href = url; }),
  reload: jest.fn(),
};
Object.defineProperty(global, 'window', {
  value: {
    location: mockWindowLocation,
    // Add other window properties if needed by the app
    alert: jest.fn(),
    confirm: jest.fn(),
    prompt: jest.fn(),
  },
  writable: true,
});

// Mock `console.error` to suppress expected errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  // Suppress specific warnings/errors that are not critical to test failures
  if (
    typeof message === 'string' &&
    (message.includes('Warning: `useNativeDriver` was not specified') ||
      message.includes('Warning: An update to %s inside a test was not wrapped in act') ||
      message.includes('Failed to fetch') ||
      message.includes('The above error occurred in the <ForwardRef(ThemeProvider)> component') ||
      message.includes('The above error occurred in the <ForwardRef(AuthForm)> component') ||
      message.includes('The above error occurred in the <ForwardRef(UserProfileForm)> component') ||
      message.includes('The above error occurred in the <ForwardRef(FlightSearchForm)> component') ||
      message.includes('The above error occurred in the <ForwardRef(FlightList)> component') ||
      message.includes('The above error occurred in the <ForwardRef(FlightCard)> component')
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock `useTheme` from `@/components/ThemeProvider` for all tests
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
  ThemeProvider: ({ children }) => children, // Render children directly
}));

// Mock `AdBanner` from `@/components/ads/AdBanner` for all tests
jest.mock('@/components/ads/AdBanner', () => ({
  AdBanner: jest.fn(() => null), // Render nothing for ads in tests
}));

// Mock `MaterialCommunityIcons` from `@expo/vector-icons`
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons', // Render as a simple string
}));

// Mock `react-native-google-mobile-ads`
jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: {
    BANNER: 'BANNER',
  },
  TestIds: {
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
  },
}));

// Mock `expo-store-review`
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  requestReview: jest.fn(() => Promise.resolve()),
}));

// Mock `expo-linking`
jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

// Mock `Alert` from `react-native`
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios', // Default to iOS for tests
      select: jest.fn((options) => options.ios),
    },
  };
});

// Mock `useTrackedFlights` hook
jest.mock('@/src/hooks/useTrackedFlights', () => ({
  useTrackedFlights: jest.fn(() => ({
    trackedFlights: [],
    flightDetails: new Map(),
    isLoading: false,
    addFlight: jest.fn(),
    removeFlight: jest.fn(),
    refreshDetails: jest.fn(),
  })),
}));

// Mock `FlightCard` component
jest.mock('@/components/FlightCard', () => ({
  FlightCard: jest.fn(({ flight, isTracked, onToggleTrack }) => (
    <mock-flight-card
      testID={`flight-card-${flight.flightIata}`}
      flight={flight}
      isTracked={isTracked}
      onToggleTrack={onToggleTrack}
    >
      <text>{flight.flightIata}</text>
      <text>{flight.airlineName}</text>
    </mock-flight-card>
  )),
}));

// Mock `FlightSearchForm` component
jest.mock('@/components/flight-search-form', () => ({
  FlightSearchForm: jest.fn(({ onSearch, isLoading }) => (
    <mock-flight-search-form onSearch={onSearch} isLoading={isLoading}>
      <button onPress={() => onSearch('JL123', '2024-07-20')}>Search</button>
    </mock-flight-search-form>
  )),
}));

// Mock `FlightList` component
jest.mock('@/components/flight-list', () => ({
  FlightList: jest.fn(({ flights, isLoading, error, onSelectFlight }) => (
    <mock-flight-list flights={flights} isLoading={isLoading} error={error} onSelectFlight={onSelectFlight}>
      {flights.map((f) => (
        <button key={f.flightIata} onPress={() => onSelectFlight(f)}>
          {f.flightIata}
        </button>
      ))}
      {isLoading && <text>Loading...</text>}
      {error && <text>Error: {error}</text>}
      {flights.length === 0 && !isLoading && !error && <text>No results</text>}
    </mock-flight-list>
  )),
}));

// Mock `AuthForm` component
jest.mock('@/components/AuthForm', () => ({
  AuthForm: jest.fn(({ type, onSubmit }) => (
    <mock-auth-form type={type} onSubmit={onSubmit}>
      <text>AuthForm</text>
    </mock-auth-form>
  )),
}));

// Mock `UserProfileForm` component
jest.mock('@/src/components/user-profile-form', () => ({
  UserProfileForm: jest.fn(({ profile, onSave, isSaving }) => (
    <mock-user-profile-form profile={profile} onSave={onSave} isSaving={isSaving}>
      <text>UserProfileForm</text>
    </mock-user-profile-form>
  )),
}));

// Mock `fetchUserProfile`, `updateUserProfile`
jest.mock('@/src/lib/actions/user', () => ({
  fetchUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

// Mock `login`, `signup`
jest.mock('@/src/lib/actions/auth', () => ({
  login: jest.fn(),
  signup: jest.fn(),
}));

// Mock `searchFlights`
jest.mock('@/src/lib/flightService', () => ({
  searchFlights: jest.fn(),
}));

// Mock `fetchSubscriptionStatus`, `createStripeCheckoutSession`, `createStripeCustomerPortalSession`
jest.mock('@/src/lib/actions/stripe', () => ({
  fetchSubscriptionStatus: jest.fn(),
  createStripeCheckoutSession: jest.fn(),
  createStripeCustomerPortalSession: jest.fn(),
}));

// Mock global fetch for subscription.tsx
global.fetch = jest.fn((input, init) => {
  if (typeof input === 'string' && input.includes('/api/stripe/checkout-session')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ url: 'https://mock-stripe-checkout.com/session' }),
    });
  }
  return Promise.reject(new Error(`Unhandled fetch request: ${input}`));
});

