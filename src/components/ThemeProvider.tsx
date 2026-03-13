import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type ColorScheme } from '@/types/theme';
// import { isRTL, getLang } from '@/i18n'; // Replaced by next-intl
import { useLocale } from 'next-intl'; // Import useLocale

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
  const locale = useLocale(); // Get current locale from next-intl
  const isRTL = locale === 'ar';

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

  // Apply theme and RTL to HTML for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.setAttribute('data-theme', theme);
      // Also apply a class for TailwindCSS dark mode if needed
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Apply RTL direction and language from next-intl's locale
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
  }, [theme, locale, isRTL]); // Depend on theme and locale

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

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

          // Apply RTL direction and language from next-intl's locale (derived from URL or headers)
          // This script runs before next-intl's client-side hydration, so it needs to infer locale.
          // For next-intl, the locale is typically part of the URL path (e.g., /en/dashboard).
          // We can try to extract it, or rely on next-intl's hydration to set it correctly.
          // For FOUC prevention, a simple approach is to use the browser's language or a default.
          // However, next-intl manages this more robustly.
          // For strict next-intl compliance, this part might be removed or simplified,
          // as next-intl's middleware and root layout handle the <html> attributes.
          // For now, we'll keep a basic inference to prevent FOUC for direction.
          const pathParts = window.location.pathname.split('/');
          const localeFromPath = pathParts[1]; // e.g., /ar/dashboard -> 'ar'
          const supportedLangs = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];
          const currentLang = supportedLangs.includes(localeFromPath) ? localeFromPath : 'ja'; // Default to 'ja' if not found or unsupported
          document.documentElement.setAttribute('lang', currentLang);
          document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

        } catch (e) {
          console.error('Failed to set initial theme or language:', e);
          // Fallback to system theme and default language if localStorage fails
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', systemTheme);
          if (systemTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          document.documentElement.setAttribute('lang', 'ja'); // Default language
          document.documentElement.setAttribute('dir', 'ltr');
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

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
