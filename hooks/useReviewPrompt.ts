import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_OPEN_COUNT_KEY = 'app_open_count';
const LAST_REVIEW_PROMPT_KEY = 'last_review_prompt';
const PROMPT_INTERVAL_DAYS = 30;
const MIN_APP_OPENS = 5;

export function useReviewPrompt(): void {
  useEffect(() => {
    async function handleReviewPrompt(): Promise<void> {
      try {
        // Increment app open count
        const currentCountStr = await AsyncStorage.getItem(APP_OPEN_COUNT_KEY);
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
        const newCount = currentCount + 1;
        await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, String(newCount));

        if (newCount < MIN_APP_OPENS) {
          return; // Not enough app opens yet
        }

        // Check if enough time has passed since last prompt
        const lastPromptStr = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
        const lastPromptTime = lastPromptStr ? new Date(lastPromptStr).getTime() : 0;
        const now = Date.now();
        const daysSinceLastPrompt = (now - lastPromptTime) / (1000 * 60 * 60 * 24);

        if (daysSinceLastPrompt < PROMPT_INTERVAL_DAYS) {
          return; // Not enough time has passed
        }

        // Check if review is available and prompt
        if (await StoreReview.isAvailableAsync()) {
          console.log('Prompting for review...');
          await StoreReview.requestReview();
          await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, new Date().toISOString());
          await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, '0'); // Reset count after prompt
        }
      } catch (error: unknown) {
        console.error('Error handling review prompt:', error);
      }
    }

    void handleReviewPrompt();
  }, []);
}

