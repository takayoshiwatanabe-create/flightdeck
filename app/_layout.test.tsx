import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import RootLayout from './_layout';
import * as SplashScreen from 'expo-splash-screen';
import { useReviewPrompt } from '@/src/hooks/useReviewPrompt';
import { getMessages } from '@/src/i18n';
import { useLocale } from 'next-intl';

// Mock external dependencies
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock('@/src/hooks/useReviewPrompt', () => ({
  useReviewPrompt: jest.fn(),
}));
jest.mock('@/components/RuokSplash', () => ({
  RuokSplash: jest.fn(({ onFinish }) => {
    // Simulate splash screen finishing after a short delay
    setTimeout(onFinish, 100);
    return <mock-ruok-splash />;
  }),
}));
jest.mock('@/src/i18n', () => ({
  getMessages: jest.fn((locale) => {
    if (locale === 'en') {
      return Promise.resolve({
        app: { title: 'FlightDeck', tagline: 'Your flight companion' },
        tabs: { home: 'Home' },
      });
    }
    return Promise.resolve({}); // Default empty messages
  }),
}));
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `app.${key}`),
  useLocale: jest.fn(() => 'en'),
  NextIntlClientProvider: ({ children }) => children,
}));
jest.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }) => <mock-theme-provider>{children}</mock-theme-provider>,
}));
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => <mock-gesture-handler-root-view>{children}</mock-gesture-handler-root-view>,
}));
jest.mock('expo-router', () => ({
  Stack: {
    Screen: jest.fn(),
  },
}));

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocale as jest.Mock).mockReturnValue('en');
  });

  it('prevents splash screen from auto-hiding on mount', () => {
    render(<RootLayout />);
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  });

  it('renders RuokSplash initially and hides it after finish', async () => {
    render(<RootLayout />);
    expect(screen.getByText('mock-ruok-splash')).toBeVisible();

    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    }, { timeout: 200 }); // Give time for the simulated splash finish
    expect(screen.queryByText('mock-ruok-splash')).toBeNull();
  });

  it('calls useReviewPrompt hook', () => {
    render(<RootLayout />);
    expect(useReviewPrompt).toHaveBeenCalled();
  });

  it('loads messages based on locale', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(getMessages).toHaveBeenCalledWith('en');
    });
  });

  it('renders null while messages are loading', () => {
    (getMessages as jest.Mock).mockReturnValueOnce(new Promise(() => {})); // Never resolve
    const { container } = render(<RootLayout />);
    expect(container.children.length).toBe(0);
  });

  it('renders Stack screens', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(screen.getByText('mock-ruok-splash')).toBeVisible();
    });
    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    }, { timeout: 200 });

    expect(screen.getByText('mock-theme-provider')).toBeVisible();
    expect(screen.getByText('mock-gesture-handler-root-view')).toBeVisible();
    expect(screen.getByText('app.title')).toBeVisible(); // Check for a title from the Stack.Screen mock
  });

  it('handles message loading error by falling back to default locale', async () => {
    (getMessages as jest.Mock)
      .mockRejectedValueOnce(new Error('Failed to load messages')) // First call fails
      .mockResolvedValueOnce({ app: { title: 'Default Title' } }); // Second call (fallback) succeeds

    render(<RootLayout />);

    await waitFor(() => {
      expect(getMessages).toHaveBeenCalledWith('en'); // Initial attempt
      expect(getMessages).toHaveBeenCalledWith('ja'); // Fallback attempt
      expect(screen.getByText('Default Title')).toBeVisible();
    });
  });
});

