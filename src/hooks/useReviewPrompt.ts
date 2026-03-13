import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_REVIEW_PROMPT_KEY = 'last_review_prompt_timestamp';
const REVIEW_PROMPT_INTERVAL_DAYS = 30; // Prompt every 30 days

export function useReviewPrompt(): void {
  useEffect(() => {
    async function checkAndPromptForReview(): Promise<void> {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        console.log('Store review not available on this device.');
        return;
      }

      const lastPromptTimestamp = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
      const now = Date.now();

      if (lastPromptTimestamp) {
        const lastPromptDate = new Date(parseInt(lastPromptTimestamp, 10));
        const daysSinceLastPrompt = (now - lastPromptDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastPrompt < REVIEW_PROMPT_INTERVAL_DAYS) {
          console.log(`Review prompt skipped. Last prompted ${Math.floor(daysSinceLastPrompt)} days ago.`);
          return;
        }
      }

      console.log('Prompting for store review...');
      const hasAction = await StoreReview.requestReview();
      if (hasAction) {
        await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, now.toString());
        console.log('Review prompt shown and timestamp updated.');
      } else {
        console.log('Review prompt was not shown (e.g., user already reviewed recently).');
      }
    }

    // Delay the prompt slightly to not interfere with initial app load
    const timer = setTimeout(() => {
      void checkAndPromptForReview();
    }, 5000); // 5 seconds delay

    return () => clearTimeout(timer);
  }, []);
}
