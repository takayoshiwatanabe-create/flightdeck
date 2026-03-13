import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InitialTheme, ThemeProvider } from '@/components/ThemeProvider';
import { useLocale } from 'next-intl'; // Corrected import

export default function Root({ children }: PropsWithChildren): JSX.Element {
  const currentLocale = useLocale(); // Get current locale from next-intl
  const isRTL = currentLocale === 'ar';

  return (
    <html lang={currentLocale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <style>{`body { overflow: hidden; }`}</style>
        <InitialTheme />
      </head>
      <body>
        <GestureHandlerRootView style={styles.container}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
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
