import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme, InitialTheme } from './ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Platform } from 'react-native';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    useColorScheme: jest.fn(() => 'light'), // Default system theme
    Platform: {
      OS: 'ios', // Default to native platform
      select: jest.fn((options) => options.ios),
    },
  };
});

// Helper component to test useTheme
const TestComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <>
      <text testID="current-theme">{theme}</text>
      <button testID="toggle-theme" onPress={toggleTheme}>Toggle</button>
      <button testID="set-light" onPress={() => void setTheme('light')}>Set Light</button>
      <button testID="set-dark" onPress={() => void setTheme('dark')}>Set Dark</button>
    </>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue('light');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // No stored theme by default
    Object.defineProperty(Platform, 'OS', { get: () => 'ios' }); // Reset platform to native
  });

  it('provides default theme (system theme) if no stored theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('current-theme').props.children).toBe('light');
    });
  });

  it('loads stored theme from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('current-theme').props.children).toBe('dark');
    });
  });

  it('toggles theme correctly and saves to AsyncStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByTestId('current-theme').props.children).toBe('light'));

    fireEvent.press(screen.getByTestId('toggle-theme'));
    await waitFor(() => {
      expect(screen.getByTestId('current-theme').props.children).toBe('dark');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'dark');
    });

    fireEvent.press(screen.getByTestId('toggle-theme'));
    await waitFor(() => {
      expect(screen.getByTestId('current-theme').props.children).toBe('light');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'light');
    });
  });

  it('sets theme correctly and saves to AsyncStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByTestId('current-theme').props.children).toBe('light'));

    fireEvent.press(screen.getByTestId('set-dark'));
    await waitFor(() => {
      expect(screen.getByTestId('current-theme').props.children).toBe('dark');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'dark');
    });

    fireEvent.press(screen.getByTestId('set-light'));
    await waitFor(() => {
      expect(screen.getByTestId('current-theme').props.children).toBe('light');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'light');
    });
  });

  it('throws error if useTheme is used outside ThemeProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error
    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within a ThemeProvider');
    jest.restoreAllMocks();
  });

  describe('InitialTheme (Web Platform)', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { get: () => 'web' });
      // Mock document.documentElement.setAttribute for web
      Object.defineProperty(document.documentElement, 'setAttribute', {
        value: jest.fn(),
        writable: true,
      });
      // Mock localStorage for web
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
        },
        writable: true,
      });
      // Mock window.matchMedia for web
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)' ? false : true, // Default to light system theme
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
        writable: true,
      });
    });

    it('renders script tag for web platform', () => {
      const { container } = render(<InitialTheme />);
      expect(container.querySelector('script')).toBeInTheDocument();
      expect(container.querySelector('script')?.id).toBe('initial-theme-script');
    });

    it('does not render script tag for native platform', () => {
      Object.defineProperty(Platform, 'OS', { get: () => 'ios' });
      const { container } = render(<InitialTheme />);
      expect(container.querySelector('script')).toBeNull();
    });

    it('script sets theme from localStorage if available', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      render(<InitialTheme />);
      // Execute the script content
      const scriptContent = (screen.getByTestId('initial-theme-script') as HTMLScriptElement).innerHTML;
      // eslint-disable-next-line no-eval
      eval(scriptContent);
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('script sets theme from system preference if no localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false, // System dark
      }));
      render(<InitialTheme />);
      const scriptContent = (screen.getByTestId('initial-theme-script') as HTMLScriptElement).innerHTML;
      // eslint-disable-next-line no-eval
      eval(scriptContent);
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('script falls back to light if system preference is not dark and no localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : true, // System light
      }));
      render(<InitialTheme />);
      const scriptContent = (screen.getByTestId('initial-theme-script') as HTMLScriptElement).innerHTML;
      // eslint-disable-next-line no-eval
      eval(scriptContent);
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });
  });
});

