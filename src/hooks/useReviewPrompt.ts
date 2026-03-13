import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = 'app_launch_count';
const LAST_PROMPT_DATE_KEY = 'last_review_prompt_date';
const MIN_LAUNCHES_FOR_PROMPT = 5;
const MIN_DAYS_BETWEEN_PROMPTS = 30;

export function useReviewPrompt(): void {
  useEffect(() => {
    async function handleReviewPrompt(): Promise<void> {
      try {
        // Increment launch count
        const currentLaunchCountStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
        let currentLaunchCount = currentLaunchCountStr ? parseInt(currentLaunchCountStr, 10) : 0;
        currentLaunchCount++;
        await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(currentLaunchCount));

        // Check if conditions for prompting are met
        if (currentLaunchCount >= MIN_LAUNCHES_FOR_PROMPT) {
          const lastPromptDateStr = await AsyncStorage.getItem(LAST_PROMPT_DATE_KEY);
          const lastPromptDate = lastPromptDateStr ? new Date(lastPromptDateStr) : null;
          const now = new Date();

          const canPrompt = !lastPromptDate ||
            (now.getTime() - lastPromptDate.getTime() > MIN_DAYS_BETWEEN_PROMPTS * 24 * 60 * 60 * 1000);

          if (canPrompt && await StoreReview.isAvailableAsync()) {
            console.log('Attempting to prompt for review...');
            await StoreReview.requestReview();
            await AsyncStorage.setItem(LAST_PROMPT_DATE_KEY, now.toISOString());
            // Reset launch count after successful prompt to prevent immediate re-prompt
            await AsyncStorage.setItem(LAUNCH_COUNT_KEY, '0');
          }
        }
      } catch (error: unknown) {
        console.error('Error handling review prompt:', error);
      }
    }

    void handleReviewPrompt();
  }, []);
}
