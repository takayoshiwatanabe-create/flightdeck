import { renderHook, act } from '@testing-library/react-hooks';
import { useReviewPrompt } from './useReviewPrompt';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock external dependencies
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('useReviewPrompt', () => {
  const MOCK_CURRENT_DATE = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_CURRENT_DATE);
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // Default: no stored data
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should not request review if not available', async () => {
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    renderHook(() => useReviewPrompt());
    await act(async () => {
      // Allow useEffect to run
    });
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  it('should request review if conditions are met (first launch after 7 days)', async () => {
    const sevenDaysAgo = new Date(MOCK_CURRENT_DATE.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(sevenDaysAgo) // lastPromptedDate
      .mockResolvedValueOnce('10'); // launchCount

    renderHook(() => useReviewPrompt());

    await act(async () => {
      // Allow useEffect to run
    });

    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastPromptedDate', MOCK_CURRENT_DATE.toISOString());
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('launchCount', '0'); // Reset launch count
  });

  it('should not request review if last prompted less than 7 days ago', async () => {
    const fiveDaysAgo = new Date(MOCK_CURRENT_DATE.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(fiveDaysAgo) // lastPromptedDate
      .mockResolvedValueOnce('10'); // launchCount

    renderHook(() => useReviewPrompt());

    await act(async () => {
      // Allow useEffect to run
    });

    expect(StoreReview.requestReview).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('lastPromptedDate', expect.any(String));
  });

  it('should not request review if launch count is less than 5', async () => {
    const tenDaysAgo = new Date(MOCK_CURRENT_DATE.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(tenDaysAgo) // lastPromptedDate
      .mockResolvedValueOnce('3'); // launchCount

    renderHook(() => useReviewPrompt());

    await act(async () => {
      // Allow useEffect to run
    });

    expect(StoreReview.requestReview).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('launchCount', '4'); // Increment launch count
  });

  it('should initialize launchCount and lastPromptedDate if not present', async () => {
    renderHook(() => useReviewPrompt());

    await act(async () => {
      // Allow useEffect to run
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('launchCount', '1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastPromptedDate', MOCK_CURRENT_DATE.toISOString());
    expect(StoreReview.requestReview).not.toHaveBeenCalled(); // Conditions not met yet
  });

  it('should increment launchCount on subsequent launches without review prompt', async () => {
    const oneDayAgo = new Date(MOCK_CURRENT_DATE.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(oneDayAgo) // lastPromptedDate
      .mockResolvedValueOnce('1'); // launchCount

    const { rerender } = renderHook(() => useReviewPrompt());
    await act(async () => {}); // First render

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('launchCount', '2');

    // Simulate another launch (rerender)
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(oneDayAgo) // lastPromptedDate
      .mockResolvedValueOnce('2'); // launchCount
    rerender();
    await act(async () => {});

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('launchCount', '3');
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  it('should handle AsyncStorage errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

    renderHook(() => useReviewPrompt());
    await act(async () => {
      // Allow useEffect to run
    });

    expect(console.error).toHaveBeenCalledWith('Error accessing AsyncStorage for review prompt:', expect.any(Error));
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});

