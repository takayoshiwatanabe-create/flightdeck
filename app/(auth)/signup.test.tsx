import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from './signup';
import { useTheme } from '@/components/ThemeProvider';
import { signup } from '@/src/lib/actions/auth';
import { useRouter } from 'expo-router';
import { useTranslations } from 'next-intl';

// Mock the external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('@/src/lib/actions/auth', () => ({
  signup: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  Link: jest.fn().mockImplementation(({ children, href }) => <mock-link href={href}>{children}</mock-link>),
}));
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => (key, params) => {
    let message = `${namespace}.${key}`;
    if (params) {
      message += ` ${JSON.stringify(params)}`;
    }
    return message;
  }),
}));

// Mock the AuthForm component
jest.mock('@/components/AuthForm', () => ({
  AuthForm: jest.fn(({ type, onSubmit }) => (
    <mock-auth-form type={type} onSubmit={onSubmit}>
      <text>AuthForm</text>
      <button onPress={() => onSubmit('newuser@example.com', 'newpassword123')}>auth.signup.button</button>
      <button onPress={() => onSubmit('newuser@example.com', 'short')}>Submit Short Password</button>
    </mock-auth-form>
  )),
}));

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (signup as jest.Mock).mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
  });

  it('renders signup form correctly', () => {
    render(<SignUpScreen />);
    expect(screen.getByText('auth.signup.title')).toBeVisible();
    expect(screen.getByText('AuthForm')).toBeVisible(); // Check for mock AuthForm
    expect(screen.getByText('auth.signup.hasAccount')).toBeVisible();
    expect(screen.getByText('auth.signup.login')).toBeVisible();
  });

  it('calls signup action with correct credentials on submit', async () => {
    render(<SignUpScreen />);

    fireEvent.press(screen.getByText('auth.signup.button')); // Trigger onSubmit from mock AuthForm

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith('newuser@example.com', 'newpassword123');
    });
  });

  // Similar to LoginScreen, validation for password length is assumed to be handled
  // within the AuthForm component. This test should focus on the integration.

  it('navigates to login screen when "Login" link is pressed', () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    render(<SignUpScreen />);

    fireEvent.press(screen.getByText('auth.signup.login'));
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  // Loading state is assumed to be handled by AuthForm.
});

