import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';

export function useReviewPrompt(): void {
  useEffect(() => {
    const promptForReview = async (): Promise<void> => {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        // You might want to add logic here to only prompt after certain conditions are met
        // e.g., after a certain number of app launches or positive interactions.
        // For now, it prompts on every app load for demonstration.
        await StoreReview.requestReview();
      }
    };

    // Delay the prompt slightly to ensure the app is fully loaded
    const timer = setTimeout(() => {
      void promptForReview();
    }, 5000); // Prompt after 5 seconds

    return () => clearTimeout(timer);
  }, []);
}

