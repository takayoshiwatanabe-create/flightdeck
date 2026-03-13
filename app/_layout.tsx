import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { RuokSplash } from "@/components/RuokSplash";
import { t } from "@/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element {
  useReviewPrompt();
  const [splashDone, setSplashDone] = useState<boolean>(false);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
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
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
