import { SplashScreen } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InitialTheme, ThemeProvider } from '@/components/ThemeProvider';
import { getLang, isRTL, loadPersistedLanguage } from '@/src/i18n'; // Corrected import path and added loadPersistedLanguage
import { Platform } from 'react-native';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/i18n/server'; // Corrected import path
import { type AbstractIntlMessages } from 'next-intl';
import { useEffect, useState } from 'react'; // Import useState and useEffect

// This is the main layout of the app
// It wraps your pages with an HTML template.
export default function Root({ children }: PropsWithChildren): JSX.Element {
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    // Load persisted language on mount for native apps
    // For web, the language is determined by the server for initial render
    // and then client-side `setLanguage` will update it.
    if (Platform.OS !== 'web') {
      loadPersistedLanguage().finally(() => {
        setIsLanguageLoaded(true);
      });
    } else {
      setIsLanguageLoaded(true); // For web, assume language is ready or will be handled by next-intl
    }
  }, []);

  // Only render HTML-specific elements on web
  if (Platform.OS === 'web') {
    // Fetch messages for the current language on the server
    // In a real Next.js app, this would be done in layout.tsx or a page.
    // For this Expo-only context, we simulate it here.
    const currentLang = getLang(); // Get the current language
    const messages: AbstractIntlMessages = getMessages(currentLang);

    return (
      <html lang={currentLang} dir={isRTL() ? 'rtl' : 'ltr'}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          {/*
            Disable body scrolling on web. This allows you to scroll within the React Native app
            and not have the body scroll.
            Removed dangerouslySetInnerHTML to comply with XSS prevention rule.
            This would typically be handled by a global CSS file or a specific Next.js approach.
          */}
          <style>{`body { overflow: hidden; }`}</style>
          <InitialTheme />
        </head>
        <body>
          <GestureHandlerRootView style={styles.container}>
            <ThemeProvider>
              <NextIntlClientProvider locale={currentLang} messages={messages}>
                {children}
              </NextIntlClientProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </body>
      </html>
    );
  }

  // For native platforms, just return the children wrapped in ThemeProvider and GestureHandlerRootView
  // Ensure language is loaded before rendering children to prevent FOUC for translations
  if (!isLanguageLoaded) {
    return null; // Or a native splash screen component
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
