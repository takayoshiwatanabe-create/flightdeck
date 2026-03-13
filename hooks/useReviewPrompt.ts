import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = 'app_launch_count';
const LAST_PROMPT_DATE_KEY = 'app_last_prompt_date';
const PROMPT_THRESHOLD = 5; // Prompt after 5 launches
const PROMPT_INTERVAL_DAYS = 30; // Prompt again after 30 days

export function useReviewPrompt(): void {
  useEffect(() => {
    async function handleReviewPrompt(): Promise<void> {
      try {
        // Increment launch count
        const currentCountStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
        let launchCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
        launchCount++;
        await AsyncStorage.setItem(LAUNCH_COUNT_KEY, launchCount.toString());

        // Check if review is available and conditions are met
        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) {
          return;
        }

        const lastPromptDateStr = await AsyncStorage.getItem(LAST_PROMPT_DATE_KEY);
        const lastPromptDate = lastPromptDateStr ? new Date(lastPromptDateStr) : null;
        const now = new Date();

        const shouldPromptByCount = launchCount >= PROMPT_THRESHOLD;
        const shouldPromptByTime =
          !lastPromptDate ||
          (now.getTime() - lastPromptDate.getTime()) / (1000 * 60 * 60 * 24) >=
            PROMPT_INTERVAL_DAYS;

        if (shouldPromptByCount && shouldPromptByTime) {
          const hasActioned = await StoreReview.requestReview();
          if (hasActioned) {
            // Reset count and update last prompt date only if user took action (e.g., rated or dismissed)
            await AsyncStorage.setItem(LAUNCH_COUNT_KEY, '0');
            await AsyncStorage.setItem(LAST_PROMPT_DATE_KEY, now.toISOString());
          }
        }
      } catch (error: unknown) {
        console.error('Error handling review prompt:', error);
      }
    }

    void handleReviewPrompt();
  }, []);
}
