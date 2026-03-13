import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type ColorScheme } from '@/types/theme';

const THEME_KEY = 'app_theme';

interface ThemeContextType {
  theme: ColorScheme;
  toggleTheme: () => void;
  setTheme: (newTheme: ColorScheme) => Promise<void>;
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
      } catch (error: unknown) {
        console.error('Failed to load theme from storage:', error);
        setThemeState(systemColorScheme ?? 'light');
      }
    }
    void loadTheme();
  }, [systemColorScheme]);

  const setTheme = async (newTheme: ColorScheme): Promise<void> => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  const toggleTheme = (): void => {
    void setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Apply theme to HTML for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.setAttribute('data-theme', theme);
      // Also apply a class for TailwindCSS dark mode if needed
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
  if (Platform.OS === 'web') {
    // The script below is designed to run before React hydrates,
    // preventing a flash of unstyled content (FOUC).
    // It directly manipulates the DOM based on localStorage or system preference.
    // This is a common pattern for theme switching in Next.js/React apps.
    // The `dangerouslySetInnerHTML` is used here because it's the standard way
    // to inject an inline script for FOUC prevention in SSR contexts.
    // The script itself is minimal and only sets a data attribute and class.
    // XSS prevention is handled by ensuring no user-supplied data is in this script.
    const scriptContent = `
      (function() {
        try {
          const storedTheme = localStorage.getItem('${THEME_KEY}');
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme;
          document.documentElement.setAttribute('data-theme', theme);
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {
          console.error('Failed to set initial theme:', e);
          // Fallback to system theme if localStorage fails
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', systemTheme);
          if (systemTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      })();
    `;

    return (
      <script
        id="initial-theme-script"
        // No nonce needed for this specific script as it's not loading external resources
        // and is critical for FOUC prevention. If CSP is very strict, a nonce might be required.
        dangerouslySetInnerHTML={{ __html: scriptContent }}
      />
    );
  }
  return null;
}

