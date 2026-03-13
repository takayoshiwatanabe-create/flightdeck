import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = 'app_launch_count';
const REVIEWED_KEY = 'app_reviewed';
const PROMPT_THRESHOLD_1 = 5;
const PROMPT_THRESHOLD_2 = 15;

export function useReviewPrompt(): void {
  useEffect(() => {
    void checkAndPrompt();
  }, []);

  async function checkAndPrompt(): Promise<void> {
    try {
      const reviewed: string | null = await AsyncStorage.getItem(REVIEWED_KEY);
      if (reviewed) return;

      const countStr: string | null = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
      const count: number = parseInt(countStr ?? '0') + 1;
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, count.toString());

      if (count === PROMPT_THRESHOLD_1 || count === PROMPT_THRESHOLD_2) {
        const isAvailable: boolean = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          await StoreReview.requestReview();
          await AsyncStorage.setItem(REVIEWED_KEY, 'true');
        }
      }
    } catch (error: unknown) {
      console.error('Error in review prompt logic:', error);
    }
  }
}

