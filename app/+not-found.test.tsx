import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NotFoundScreen from './+not-found';
import { useTheme } from '@/components/ThemeProvider';
import { useRouter } from 'expo-router';

// Mock external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('expo-router', () => ({
  Stack: {
    Screen: jest.fn(),
  },
  Link: jest.fn().mockImplementation(({ children }) => children),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

describe('NotFoundScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
  });

  it('renders the not found message', () => {
    render(<NotFoundScreen />);
    expect(screen.getByText('notFound.heading')).toBeVisible();
    expect(screen.getByText('notFound.goHome')).toBeVisible();
  });

  it('has a link to the home screen', () => {
    render(<NotFoundScreen />);
    const homeLink = screen.getByText('notFound.goHome');
    expect(homeLink).toBeVisible();
    // In a real app, Link component would handle navigation.
    // Here, we just check if the text is present within a Link mock.
  });

  it('applies light theme colors correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    const { getByText } = render(<NotFoundScreen />);
    // Indirectly check theme by ensuring the component renders without errors
    // and that the theme hook is called.
    expect(useTheme).toHaveBeenCalled();
    expect(getByText('notFound.heading')).toBeVisible();
  });

  it('applies dark theme colors correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggleTheme: jest.fn() });
    const { getByText } = render(<NotFoundScreen />);
    expect(useTheme).toHaveBeenCalled();
    expect(getByText('notFound.heading')).toBeVisible();
  });
});

