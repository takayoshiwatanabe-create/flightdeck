import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthForm } from './AuthForm';
import { useTheme } from './ThemeProvider';

// Mock external dependencies
jest.mock('./ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('AuthForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders login form correctly', () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
    expect(screen.getByPlaceholderText('auth.form.emailPlaceholder')).toBeVisible();
    expect(screen.getByPlaceholderText('auth.form.passwordPlaceholder')).toBeVisible();
    expect(screen.getByText('auth.login.button')).toBeVisible();
    expect(screen.getByText('auth.form.or')).toBeVisible();
    expect(screen.getByText('auth.form.googleLogin')).toBeVisible();
  });

  it('renders signup form correctly', () => {
    render(<AuthForm type="signup" onSubmit={mockOnSubmit} />);
    expect(screen.getByPlaceholderText('auth.form.emailPlaceholder')).toBeVisible();
    expect(screen.getByPlaceholderText('auth.form.passwordPlaceholder')).toBeVisible();
    expect(screen.getByText('auth.signup.button')).toBeVisible();
  });

  it('submits with valid credentials for login', async () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.emailPlaceholder'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.passwordPlaceholder'), 'password123');
    fireEvent.press(screen.getByText('auth.login.button'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    expect(screen.queryByText('auth.form.error.emptyFields')).toBeNull();
  });

  it('submits with valid credentials for signup', async () => {
    render(<AuthForm type="signup" onSubmit={mockOnSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.emailPlaceholder'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.passwordPlaceholder'), 'newpassword123');
    fireEvent.press(screen.getByText('auth.signup.button'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('new@example.com', 'newpassword123');
    });
  });

  it('shows error for empty fields', async () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
    fireEvent.press(screen.getByText('auth.login.button'));
    await waitFor(() => {
      expect(screen.getByText('auth.form.error.emptyFields')).toBeVisible();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.emailPlaceholder'), 'invalid-email');
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.passwordPlaceholder'), 'password123');
    fireEvent.press(screen.getByText('auth.login.button'));
    await waitFor(() => {
      expect(screen.getByText('auth.form.error.invalidEmail')).toBeVisible();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error for password too short on signup', async () => {
    render(<AuthForm type="signup" onSubmit={mockOnSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.emailPlaceholder'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.passwordPlaceholder'), 'short');
    fireEvent.press(screen.getByText('auth.signup.button'));
    await waitFor(() => {
      expect(screen.getByText('auth.form.error.passwordTooShort')).toBeVisible();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
    const passwordInput = screen.getByPlaceholderText('auth.form.passwordPlaceholder');
    const eyeIcon = screen.getByLabelText('auth.form.showPassword');

    expect(passwordInput.props.secureTextEntry).toBe(true);
    fireEvent.press(eyeIcon);
    expect(passwordInput.props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('auth.form.hidePassword')).toBeVisible();
    fireEvent.press(screen.getByLabelText('auth.form.hidePassword'));
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('shows loading state on button during submission', async () => {
    mockOnSubmit.mockReturnValueOnce(new Promise(() => {})); // Never resolve
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.emailPlaceholder'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('auth.form.passwordPlaceholder'), 'password123');
    fireEvent.press(screen.getByText('auth.login.button'));

    expect(screen.getByText('auth.form.loading')).toBeVisible();
    expect(screen.getByPlaceholderText('auth.form.emailPlaceholder')).toBeDisabled();
  });
});

