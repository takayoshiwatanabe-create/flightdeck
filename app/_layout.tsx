import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { RuokSplash } from "@/components/RuokSplash";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useReviewPrompt();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "フライト管理アプリ「FlightDeck」" }} />
      </Stack>
      <StatusBar style="auto" />
      {!splashDone && (
        <RuokSplash
          onFinish={() => {
            setSplashDone(true);
            SplashScreen.hideAsync();
          }}
        />
      )}
    </>
  );
}
