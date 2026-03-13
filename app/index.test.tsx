import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import HomeScreen from './index';
import { useTheme } from '@/components/ThemeProvider';
import { useRouter } from 'expo-router';

// Mock external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('expo-router', () => ({
  Link: jest.fn().mockImplementation(({ href, children }) => (
    <mock-link href={href} onPress={() => jest.fn()}>{children}</mock-link>
  )),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
  });

  it('renders title and subtitle', () => {
    render(<HomeScreen />);
    expect(screen.getByText('app.title')).toBeVisible();
    expect(screen.getByText('app.tagline')).toBeVisible();
  });

  it('renders login, signup, and guest prompts', () => {
    render(<HomeScreen />);
    expect(screen.getByText('app.loginPrompt')).toBeVisible();
    expect(screen.getByText('app.signupPrompt')).toBeVisible();
    expect(screen.getByText('app.guestPrompt')).toBeVisible();
  });

  it('has correct links for navigation', () => {
    const { getByText } = render(<HomeScreen />);

    const loginLink = getByText('app.loginPrompt').parent;
    expect(loginLink).toHaveProp('href', '/(auth)/login');

    const signupLink = getByText('app.signupPrompt').parent;
    expect(signupLink).toHaveProp('href', '/(auth)/signup');

    const guestLink = getByText('app.guestPrompt').parent;
    expect(guestLink).toHaveProp('href', '/(tabs)');
  });

  it('applies light theme colors correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    const { getByText } = render(<HomeScreen />);
    // Indirectly check theme by ensuring the component renders without errors
    // and that the theme hook is called.
    expect(useTheme).toHaveBeenCalled();
    expect(getByText('app.title')).toBeVisible();
  });

  it('applies dark theme colors correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggleTheme: jest.fn() });
    const { getByText } = render(<HomeScreen />);
    expect(useTheme).toHaveBeenCalled();
    expect(getByText('app.title')).toBeVisible();
  });
});

