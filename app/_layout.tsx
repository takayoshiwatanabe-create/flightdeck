import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { RuokSplash } from "@/components/RuokSplash";
import { t, lang } from "@/i18n"; // Import lang
import { ThemeProvider } from "@/components/ThemeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { NextIntlClientProvider } from "next-intl"; // Import NextIntlClientProvider
import { getMessages } from "@/i18n/server"; // Import server-side message fetching
import { Platform } from "react-native";
import { type AbstractIntlMessages } from "next-intl";

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element {
  useReviewPrompt();
  const [splashDone, setSplashDone] = useState<boolean>(false);

  // Fetch messages for the current language
  // In a real Next.js app, this would be an async server component.
  // For this Expo-only context, we fetch synchronously.
  const messages: AbstractIntlMessages = getMessages(lang);

  // For native, wrap with NextIntlClientProvider here.
  // For web, it's wrapped in +html.tsx.
  const content = (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        {Platform.OS !== 'web' ? (
          <NextIntlClientProvider locale={lang} messages={messages}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              {/* The root index.tsx is now a landing page for auth/guest selection */}
              <Stack.Screen name="index" options={{ title: t("app.title") }} />
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
        ) : (
          <>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              {/* The root index.tsx is now a landing page for auth/guest selection */}
              <Stack.Screen name="index" options={{ title: t("app.title") }} />
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
          </>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
