import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type ColorScheme } from '@/types/theme';
// import { useLocale } from 'next-intl'; // Removed as it's not used for direct DOM manipulation here.

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
  // const locale = useLocale(); // Removed
  // const isRTL = locale === 'ar'; // Removed

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // The 'dir' and 'lang' attributes are now managed by next-intl's root layout,
      // as per the spec's "RTL対応ルール" and "多言語翻訳の品質基準" which implies
      // next-intl handling the HTML attributes.
      // Removing direct manipulation here to avoid conflicts and ensure next-intl is the SSOT for these.
      // document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      // document.documentElement.setAttribute('lang', locale);
    }
  }, [theme]); // Removed locale, isRTL from dependencies as they are not used for direct DOM manipulation here.

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function InitialTheme(): JSX.Element | null {
  if (Platform.OS === 'web') {
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

          // The 'dir' and 'lang' attributes are now managed by next-intl's root layout.
          // Removing direct manipulation here to avoid conflicts.
          // const pathParts = window.location.pathname.split('/');
          // const localeFromPath = pathParts[1];
          // const supportedLangs = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];
          // const currentLang = supportedLangs.includes(localeFromPath) ? localeFromPath : 'ja';
          // document.documentElement.setAttribute('lang', currentLang);
          // document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

        } catch (e) {
          console.error('Failed to set initial theme or language:', e);
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', systemTheme);
          if (systemTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          // Fallback for lang/dir also removed here, relying on next-intl's root layout.
          // document.documentElement.setAttribute('lang', 'ja');
          // document.documentElement.setAttribute('dir', 'ltr');
        }
      })();
    `;

    return (
      <script
        id="initial-theme-script"
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

