import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { RuokSplash } from "@/components/RuokSplash";
import { useTranslations } from "next-intl"; // Corrected import
import { ThemeProvider } from "@/components/ThemeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useLocale } from "next-intl"; // Import useLocale

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element {
  const [splashDone, setSplashDone] = useState<boolean>(false);
  useReviewPrompt();
  const t = useTranslations('app'); // Use useTranslations hook
  const locale = useLocale(); // Get current locale for the root layout

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
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
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
