import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = 'app_launch_count';
const LAST_PROMPT_DATE_KEY = 'last_review_prompt_date';
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

        // Check if review is available
        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) {
          console.log('Store review is not available on this device.');
          return;
        }

        // Check if already rated or opted out
        const hasAction = await StoreReview.has
        if (hasAction) {
          console.log('User has already taken action on a review prompt.');
          return;
        }

        // Get last prompt date
        const lastPromptDateStr = await AsyncStorage.getItem(LAST_PROMPT_DATE_KEY);
        const lastPromptDate = lastPromptDateStr ? new Date(lastPromptDateStr) : null;
        const now = new Date();

        const shouldPromptByCount = launchCount >= PROMPT_THRESHOLD;
        const shouldPromptByTime = !lastPromptDate ||
          (now.getTime() - lastPromptDate.getTime()) / (1000 * 60 * 60 * 24) >= PROMPT_INTERVAL_DAYS;

        if (shouldPromptByCount && shouldPromptByTime) {
          console.log('Attempting to prompt for review...');
          const result = await StoreReview.requestReview();
          console.log('Review prompt result:', result);
          await AsyncStorage.setItem(LAST_PROMPT_DATE_KEY, now.toISOString());
          await AsyncStorage.setItem(LAUNCH_COUNT_KEY, '0'); // Reset count after prompt
        }
      } catch (error: unknown) {
        console.error('Error handling review prompt:', error);
      }
    }

    void handleReviewPrompt();
  }, []);
}
