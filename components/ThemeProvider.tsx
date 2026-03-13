import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type ColorScheme } from '@/types/theme';

const THEME_KEY = 'app_theme';

interface ThemeContextType {
  theme: ColorScheme;
  toggleTheme: () => void;
  setTheme: (newTheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ColorScheme>(systemColorScheme ?? 'light');

  useEffect(() => {
    async function loadTheme() {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        } else {
          setThemeState(systemColorScheme ?? 'light');
        }
      } catch (error) {
        console.error('Failed to load theme from storage:', error);
        setThemeState(systemColorScheme ?? 'light');
      }
    }
    loadTheme();
  }, [systemColorScheme]);

  const setTheme = async (newTheme: ColorScheme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Component to inject initial theme into HTML for web SSR
export function InitialTheme() {
  const systemColorScheme = useColorScheme();
  const initialTheme = systemColorScheme ?? 'light'; // Fallback for SSR

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
