import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TabSettingsScreen from './settings';
import { useTheme } from '@/components/ThemeProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

// Mock external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn(), setTheme: jest.fn() })),
}));
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `settings.${key}`),
  useLocale: jest.fn(() => 'en'),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: jest.fn(),
    },
  };
});
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('TabSettingsScreen', () => {
  const mockToggleTheme = jest.fn();
  const mockSetTheme = jest.fn();
  const mockRouterPush = jest.fn();
  const mockRouterReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
      setTheme: mockSetTheme,
    });
    (useLocale as jest.Mock).mockReturnValue('en');
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      replace: mockRouterReplace,
    });
  });

  it('renders settings options correctly', () => {
    render(<TabSettingsScreen />);
    expect(screen.getByText('settings.title')).toBeVisible();
    expect(screen.getByText('settings.darkMode')).toBeVisible();
    expect(screen.getByText('settings.language')).toBeVisible();
    expect(screen.getByText('settings.subscription')).toBeVisible();
  });

  it('toggles dark mode when switch is pressed', () => {
    render(<TabSettingsScreen />);
    const darkModeSwitch = screen.getByTestId('switch'); // Assuming Switch has a testID
    fireEvent(darkModeSwitch, 'valueChange', true);
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('opens language picker modal when language setting is pressed', () => {
    render(<TabSettingsScreen />);
    fireEvent.press(screen.getByLabelText('settings.language'));
    expect(screen.getByText('settings.selectLanguage')).toBeVisible();
    expect(screen.getByText('settings.common.cancel')).toBeVisible();
  });

  it('selects a new language and triggers router.replace', async () => {
    render(<TabSettingsScreen />);
    fireEvent.press(screen.getByLabelText('settings.language')); // Open modal

    await waitFor(() => {
      expect(screen.getByText('settings.selectLanguage')).toBeVisible();
    });

    fireEvent.press(screen.getByText('日本語')); // Select Japanese
    expect(mockRouterReplace).toHaveBeenCalledWith('/ja/(tabs)/settings');
    expect(Alert.alert).toHaveBeenCalledWith('settings.languageRestart');
  });

  it('closes language picker modal when close button is pressed', async () => {
    render(<TabSettingsScreen />);
    fireEvent.press(screen.getByLabelText('settings.language')); // Open modal

    await waitFor(() => {
      expect(screen.getByText('settings.selectLanguage')).toBeVisible();
    });

    fireEvent.press(screen.getByLabelText('settings.common.cancel')); // Close modal
    expect(screen.queryByText('settings.selectLanguage')).toBeNull();
  });

  it('navigates to subscription screen when subscription setting is pressed', () => {
    render(<TabSettingsScreen />);
    fireEvent.press(screen.getByText('settings.subscription'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/settings/subscription');
  });

  it('displays current language label correctly', () => {
    (useLocale as jest.Mock).mockReturnValue('ja');
    render(<TabSettingsScreen />);
    expect(screen.getByText('日本語')).toBeVisible();
  });
});

