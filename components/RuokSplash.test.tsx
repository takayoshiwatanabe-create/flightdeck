import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { RuokSplash } from './RuokSplash';
import { Animated } from 'react-native';

// Mock Animated module to control animations in tests
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    Animated: {
      ...actual.Animated,
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback()), // Immediately call callback
      })),
      sequence: jest.fn((animations) => ({
        start: jest.fn((callback) => {
          animations.forEach((anim) => anim.start());
          callback();
        }),
      })),
      delay: jest.fn(() => ({
        start: jest.fn((callback) => callback()), // Immediately call callback
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
      })),
    },
  };
});

describe('RuokSplash', () => {
  const mockOnFinish = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the splash image', () => {
    render(<RuokSplash onFinish={mockOnFinish} />);
    expect(screen.getByTestId('splash-image')).toBeVisible(); // Assuming the image has a testID
  });

  it('calls onFinish after animation sequence completes', async () => {
    render(<RuokSplash onFinish={mockOnFinish} />);

    // Wait for the animation sequence to complete (mocked to be immediate)
    await waitFor(() => {
      expect(mockOnFinish).toHaveBeenCalledTimes(1);
    });

    // Verify Animated.timing calls
    expect(Animated.timing).toHaveBeenCalledTimes(2); // Fade in and fade out
    expect(Animated.delay).toHaveBeenCalledTimes(1);
    expect(Animated.sequence).toHaveBeenCalledTimes(1);
  });

  it('initial opacity is 0 and then animates to 1 and back to 0', async () => {
    const mockOpacityValue = { setValue: jest.fn() };
    (Animated.Value as jest.Mock).mockReturnValue(mockOpacityValue);

    render(<RuokSplash onFinish={mockOnFinish} />);

    // The mock Animated.timing immediately calls its callback, so we check the setValue calls
    // The sequence is: opacity 0 -> 1, delay, opacity 1 -> 0
    expect(Animated.timing).toHaveBeenCalledWith(expect.any(Object), {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    });
    expect(Animated.timing).toHaveBeenCalledWith(expect.any(Object), {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    });
  });
});

// Add a testID to the image in RuokSplash.tsx for easier testing
// ===FILE: components/RuokSplash.tsx===
// ...
//       <Animated.Image
//         source={require("../assets/ruok-splash.png")}
//         style={[styles.image, { opacity }]}
//         resizeMode="contain"
//         testID="splash-image" // Added testID
//       />
// ...
// 