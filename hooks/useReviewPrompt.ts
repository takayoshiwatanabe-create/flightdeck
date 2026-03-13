import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = 'app_launch_count';
const REVIEWED_KEY = 'app_reviewed';

export function useReviewPrompt(): void {
  useEffect(() => {
    void checkAndPrompt(); // Use void to explicitly ignore the Promise
  }, []);

  async function checkAndPrompt(): Promise<void> {
    try {
      const reviewed = await AsyncStorage.getItem(REVIEWED_KEY);
      if (reviewed) return;

      const countStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
      const count = parseInt(countStr ?? '0') + 1;
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, count.toString());

      if (count === 5 || count === 15) {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          await StoreReview.requestReview();
          await AsyncStorage.setItem(REVIEWED_KEY, 'true');
        }
      }
    } catch (error: unknown) { // Use unknown for caught errors
      console.error('Error in review prompt logic:', error);
    }
  }
}

