import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { RuokSplash } from "@/components/RuokSplash";
import { t } from "@/i18n"; // Import t for translation

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element {
  useReviewPrompt();
  const [splashDone, setSplashDone] = useState<boolean>(false);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* The root index.tsx should not be directly accessible if auth flow is primary.
            It's better to redirect from index or make it a landing page without direct content.
            For now, removing the title to avoid double title with the actual content of index.tsx. */}
        <Stack.Screen name="index" options={{ title: t("app.title") }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      {!splashDone && (
        <RuokSplash
          onFinish={() => {
            setSplashDone(true);
            void SplashScreen.hideAsync(); // Use void to explicitly ignore the Promise
          }}
        />
      )}
    </>
  );
}
