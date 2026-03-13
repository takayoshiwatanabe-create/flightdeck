import { SplashScreen } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InitialTheme, ThemeProvider } from '@/components/ThemeProvider';
import { isRTL, lang } from '@/i18n';

// This is the main layout of the app
// It wraps your pages with an HTML template.
export default function Root({ children }: PropsWithChildren): JSX.Element {
  return (
    <html lang={lang} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/*
          Disable body scrolling on web. This allows you to scroll within the React Native app
          and not have the body scroll.
        */}
        <style dangerouslySetInnerHTML={{ __html: `body { overflow: hidden; }` }} />
        <InitialTheme />
      </head>
      <body>
        <GestureHandlerRootView style={styles.container}>
          <ThemeProvider>{children}</ThemeProvider>
        </GestureHandlerRootView>
      </body>
    </html>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
