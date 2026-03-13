import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type ColorScheme } from '@/types/theme';

const THEME_KEY = 'app_theme';

interface ThemeContextType {
  theme: ColorScheme;
  toggleTheme: () => void;
  setTheme: (newTheme: ColorScheme) => Promise<void>; // Changed to Promise<void> as AsyncStorage is async
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren): JSX.Element {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ColorScheme>(systemColorScheme ?? 'light');

  useEffect(() => {
    async function loadTheme(): Promise<void> {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        } else {
          setThemeState(systemColorScheme ?? 'light');
        }
      } catch (error: unknown) { // Use unknown for caught errors
        console.error('Failed to load theme from storage:', error);
        setThemeState(systemColorScheme ?? 'light');
      }
    }
    void loadTheme(); // Use void to explicitly ignore the Promise
  }, [systemColorScheme]);

  const setTheme = async (newTheme: ColorScheme): Promise<void> => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  const toggleTheme = (): void => {
    void setTheme(theme === 'light' ? 'dark' : 'light'); // Use void to explicitly ignore the Promise
  };

  // Apply theme to HTML for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Component to inject initial theme into HTML for web SSR
export function InitialTheme(): JSX.Element | null {
  const systemColorScheme = useColorScheme();
  const initialTheme: ColorScheme = systemColorScheme ?? 'light'; // Fallback for SSR

  if (Platform.OS === 'web') {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const storedTheme = localStorage.getItem('${THEME_KEY}');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme;
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {
                console.error('Failed to set initial theme:', e);
                document.documentElement.setAttribute('data-theme', '${initialTheme}');
              }
            })();
          `,
        }}
      />
    );
  }
  return null;
}
