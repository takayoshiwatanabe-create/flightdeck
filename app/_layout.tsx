import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { RuokSplash } from "@/components/RuokSplash";
import { useTranslations } from "next-intl";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useLocale } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { getRequestConfig } from 'next-intl/server'; // Import getRequestConfig from next-intl/server

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout(): JSX.Element {
  const [splashDone, setSplashDone] = useState<boolean>(false);
  useReviewPrompt();
  const t = useTranslations('app');
  const locale = useLocale();

  // Dynamically load messages based on the current locale
  const [messages, setMessages] = useState<Record<string, string | Record<string, string>> | undefined>(undefined);

  // Use an effect to load messages
  useState(() => {
    const loadMessages = async (): Promise<void> => {
      try {
        const requestConfig = await getRequestConfig({ locale });
        setMessages(requestConfig.messages);
      } catch (error: unknown) {
        console.error('Failed to load messages for locale:', locale, error);
        // Fallback to default messages or handle error
        const defaultRequestConfig = await getRequestConfig({ locale: 'ja' });
        setMessages(defaultRequestConfig.messages);
      }
    };
    void loadMessages();
  }, [locale]);

  if (!messages) {
    // Optionally render a loading state or a fallback UI while messages are loading
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ title: t("title") }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            {!splashDone && (
              <RuokSplash
                onFinish={() => {
                  setSplashDone(true);
                  void SplashScreen.hideAsync();
                }}
              />
            )}
          </NextIntlClientProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

