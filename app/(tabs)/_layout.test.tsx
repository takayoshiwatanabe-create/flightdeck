import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TabLayout from './_layout';
import { useTheme } from '@/components/ThemeProvider';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs } from 'expo-router'; // Import Tabs from expo-router

// Mock the external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `tabs.${key}`),
  useLocale: jest.fn(() => 'en'),
}));
jest.mock('expo-router', () => ({
  Tabs: {
    Screen: jest.fn(({ options }) => <mock-tab-screen title={options.title} />),
    // Mock the Tabs component itself to capture its props
    _default: jest.fn(({ children, screenOptions }) => (
      <mock-tabs-container testID="mock-tabs-container" screenOptions={screenOptions}>
        {children}
      </mock-tabs-container>
    )),
  },
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (useLocale as jest.Mock).mockReturnValue('en');
  });

  it('renders all tab screens with correct titles', () => {
    render(<TabLayout />);

    expect(screen.getByText('tabs.home')).toBeVisible();
    expect(screen.getByText('tabs.search')).toBeVisible();
    expect(screen.getByText('tabs.settings')).toBeVisible();
  });

  it('applies light theme colors correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    render(<TabLayout />);

    // Check if the Tabs component received the correct screenOptions for light theme
    const tabsContainer = screen.getByTestId('mock-tabs-container');
    expect(tabsContainer.props.screenOptions.tabBarActiveTintColor).toBe('#22D3EE');
    expect(tabsContainer.props.screenOptions.tabBarInactiveTintColor).toBe('#9CA3AF');
    expect(tabsContainer.props.screenOptions.tabBarStyle.backgroundColor).toBe('#FFFFFF');
    expect(tabsContainer.props.screenOptions.headerStyle.backgroundColor).toBe('#FFFFFF');
    expect(tabsContainer.props.screenOptions.headerTintColor).toBe('#1F2937');
    expect(tabsContainer.props.screenOptions.tabBarStyle.borderTopColor).toBe('#E5E7EB');
  });

  it('applies dark theme colors correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggleTheme: jest.fn() });
    render(<TabLayout />);

    // Check if the Tabs component received the correct screenOptions for dark theme
    const tabsContainer = screen.getByTestId('mock-tabs-container');
    expect(tabsContainer.props.screenOptions.tabBarActiveTintColor).toBe('#22D3EE');
    expect(tabsContainer.props.screenOptions.tabBarInactiveTintColor).toBe('#6B7280');
    expect(tabsContainer.props.screenOptions.tabBarStyle.backgroundColor).toBe('#1F2937');
    expect(tabsContainer.props.screenOptions.headerStyle.backgroundColor).toBe('#1F2937');
    expect(tabsContainer.props.screenOptions.headerTintColor).toBe('#F9FAFB');
    expect(tabsContainer.props.screenOptions.tabBarStyle.borderTopColor).toBe('#374151');
  });

  it('sets writingDirection to rtl for Arabic locale', () => {
    (useLocale as jest.Mock).mockReturnValue('ar');
    render(<TabLayout />);

    const tabsContainer = screen.getByTestId('mock-tabs-container');
    expect(tabsContainer.props.screenOptions.tabBarLabelStyle.writingDirection).toBe('rtl');
  });

  it('sets writingDirection to ltr for non-Arabic locale', () => {
    (useLocale as jest.Mock).mockReturnValue('ja');
    render(<TabLayout />);

    const tabsContainer = screen.getByTestId('mock-tabs-container');
    expect(tabsContainer.props.screenOptions.tabBarLabelStyle.writingDirection).toBe('ltr');
  });
});

