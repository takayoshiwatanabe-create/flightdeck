import { SplashScreen } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InitialTheme, ThemeProvider } from '@/components/ThemeProvider';
import { isRTL, lang } from '@/i18n';
import { Platform } from 'react-native';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/i18n/server';
import { type AbstractIntlMessages } from 'next-intl';

// This is the main layout of the app
// It wraps your pages with an HTML template.
export default function Root({ children }: PropsWithChildren): JSX.Element {
  // Only render HTML-specific elements on web
  if (Platform.OS === 'web') {
    // Fetch messages for the current language on the server
    // In a real Next.js app, this would be done in layout.tsx or a page.
    // For this Expo-only context, we simulate it here.
    const messages: AbstractIntlMessages = getMessages(lang);

    return (
      <html lang={lang} dir={isRTL ? 'rtl' : 'ltr'}>
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
              <NextIntlClientProvider locale={lang} messages={messages}>
                {children}
              </NextIntlClientProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </body>
      </html>
    );
  }

  // For native platforms, just return the children wrapped in ThemeProvider and GestureHandlerRootView
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
