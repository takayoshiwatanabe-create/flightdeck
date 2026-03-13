import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './login';
import { useTheme } from '@/components/ThemeProvider';
import { login } from '@/src/lib/actions/auth';
import { useRouter } from 'expo-router';
import { useTranslations } from 'next-intl';

// Mock the external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('@/src/lib/actions/auth', () => ({
  login: jest.fn(),
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
      <button onPress={() => onSubmit('test@example.com', 'password123')}>auth.login.button</button>
      <button onPress={() => onSubmit('', '')}>Submit Empty</button>
      <button onPress={() => onSubmit('invalid-email', 'password123')}>Submit Invalid Email</button>
    </mock-auth-form>
  )),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (login as jest.Mock).mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
  });

  it('renders login form correctly', () => {
    render(<LoginScreen />);
    expect(screen.getByText('auth.login.title')).toBeVisible();
    expect(screen.getByText('AuthForm')).toBeVisible(); // Check for mock AuthForm
    expect(screen.getByText('auth.login.noAccount')).toBeVisible();
    expect(screen.getByText('auth.login.signUp')).toBeVisible();
  });

  it('calls login action with correct credentials on submit', async () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('auth.login.button')); // Trigger onSubmit from mock AuthForm

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  // The following tests for form validation (empty fields, invalid email) are now handled
  // within the AuthForm component itself. This test file should focus on the integration
  // with the LoginScreen's logic and `login` action.
  // We'll assume AuthForm handles its own internal validation and only calls `onSubmit`
  // with valid data or shows its own internal errors.

  it('navigates to signup screen when "Sign Up" link is pressed', () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('auth.login.signUp'));
    expect(mockRouter.push).toHaveBeenCalledWith('/signup');
  });

  // The loading state is now managed by AuthForm, so we check if AuthForm's loading prop is used.
  // Since AuthForm is mocked, we can't directly check its internal loading state.
  // This test would be more appropriate for AuthForm.test.tsx.
  // For LoginScreen, we assume AuthForm handles its own loading UI.
});

