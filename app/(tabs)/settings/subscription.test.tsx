import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SubscriptionScreen from './subscription';
import { useTheme } from '@/components/ThemeProvider';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import { useTranslations } from 'next-intl';
import {
  fetchSubscriptionStatus,
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
} from '@/src/lib/actions/stripe'; // Import actual actions

// Mock the external dependencies
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn() })),
}));
jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios', // Default to 'ios' for native tests
      select: jest.fn((options) => options.ios),
    },
  };
});
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => (key, params) => {
    let message = `${namespace}.${key}`;
    if (params) {
      message += ` ${JSON.stringify(params)}`;
    }
    return message;
  }),
  useLocale: jest.fn(() => 'en'), // Mock useLocale as it's used in the component
}));

// Mock the stripe actions
jest.mock('@/src/lib/actions/stripe', () => ({
  fetchSubscriptionStatus: jest.fn(),
  createStripeCheckoutSession: jest.fn(),
  createStripeCustomerPortalSession: jest.fn(),
}));

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (fetchSubscriptionStatus as jest.Mock).mockResolvedValue({ isPremium: false, currentPeriodEnd: null });
    (createStripeCheckoutSession as jest.Mock).mockResolvedValue({ url: 'https://mock-stripe-checkout.com/session' });
    (createStripeCustomerPortalSession as jest.Mock).mockResolvedValue({ url: 'https://mock-stripe-portal.com/session' });
    // Reset Platform.OS to default for each test
    Object.defineProperty(Platform, 'OS', { get: () => 'ios' });
  });

  it('renders loading state initially', () => {
    (fetchSubscriptionStatus as jest.Mock).mockReturnValueOnce(new Promise(() => {})); // Never resolve
    render(<SubscriptionScreen />);
    expect(screen.getByA11yLabel('Loading')).toBeVisible();
    expect(screen.getByText('settings.subscription.loading')).toBeVisible();
  });

  it('renders free user subscription options', async () => {
    render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(screen.getByText('settings.subscription.title')).toBeVisible();
      expect(screen.getByText('settings.subscription.status.free')).toBeVisible();
      expect(screen.getByText('settings.subscription.monthlyPlan')).toBeVisible();
      expect(screen.getByText('settings.subscription.yearlyPlan')).toBeVisible();
      expect(screen.getByText('settings.subscription.manageSubscription')).toBeVisible();
    });
  });

  it('renders premium user subscription status', async () => {
    const premiumEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    (fetchSubscriptionStatus as jest.Mock).mockResolvedValueOnce({ isPremium: true, currentPeriodEnd: premiumEndDate });
    render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(screen.getByText('settings.subscription.status.premium')).toBeVisible();
      const expectedDateString = new Date(premiumEndDate).toLocaleDateString('en');
      expect(screen.getByText(`settings.subscription.currentPeriodEnd {"date":"${expectedDateString}"}`)).toBeVisible();
      expect(screen.queryByText('settings.subscription.monthlyPlan')).toBeNull(); // Should not show subscribe options
    });
  });

  it('handles "Manage Subscription" button press for web platform', async () => {
    Object.defineProperty(Platform, 'OS', { get: () => 'web' });
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.manageSubscription')).toBeVisible());

    const manageButton = screen.getByText('settings.subscription.manageSubscription');
    fireEvent.press(manageButton);

    await waitFor(() => {
      expect(createStripeCustomerPortalSession).toHaveBeenCalled();
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: '' }; // Mock window.location
      
      const okButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
      okButton.onPress(); // This will trigger the navigation
      expect(window.location.href).toBe('https://mock-stripe-portal.com/session');

      (window as any).location = originalLocation; // Restore original
    });
  });

  it('handles "Manage Subscription" button press for native platform', async () => {
    Object.defineProperty(Platform, 'OS', { get: () => 'ios' });
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.manageSubscription')).toBeVisible());

    const manageButton = screen.getByText('settings.subscription.manageSubscription');
    fireEvent.press(manageButton);

    await waitFor(() => {
      expect(createStripeCustomerPortalSession).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'settings.subscription.manageSubscription',
        'settings.subscription.redirectingToStripe',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'common.ok',
            onPress: expect.any(Function),
          }),
        ])
      );
    });

    const okButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
    okButton.onPress();
    expect(Linking.openURL).toHaveBeenCalledWith('https://mock-stripe-portal.com/session');
  });

  it('handles "Subscribe" button press for monthly plan', async () => {
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.monthlyPlan')).toBeVisible());

    const subscribeButton = screen.getAllByText('settings.subscription.subscribe')[0];
    fireEvent.press(subscribeButton);

    await waitFor(() => {
      expect(createStripeCheckoutSession).toHaveBeenCalledWith('price_123monthly');
      expect(Alert.alert).toHaveBeenCalledWith(
        'settings.subscription.subscribe',
        'settings.subscription.initiatingPurchase', // Updated to match IAP flow
        expect.arrayContaining([
          expect.objectContaining({
            text: 'common.ok',
            onPress: expect.any(Function),
          }),
        ])
      );
    });

    const okButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
    okButton.onPress();
    // For native, we expect a console log about initiating IAP, not Linking.openURL
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('shows loading indicator when redirecting', async () => {
    (createStripeCheckoutSession as jest.Mock).mockReturnValueOnce(new Promise(() => {})); // Never resolve
    render(<SubscriptionScreen />);
    const monthlyButton = screen.getAllByText('settings.subscription.subscribe')[0];
    fireEvent.press(monthlyButton);

    await waitFor(() => {
      expect(screen.getAllByA11yLabel('Loading')[0]).toBeVisible();
    });
  });

  it('displays error if fetching subscription status fails', async () => {
    (fetchSubscriptionStatus as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(screen.getByText('settings.subscription.error.fetchFailed')).toBeVisible();
    });
  });

  it('displays error if creating checkout session fails', async () => {
    (createStripeCheckoutSession as jest.Mock).mockResolvedValueOnce(null);
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.monthlyPlan')).toBeVisible());

    const subscribeButton = screen.getAllByText('settings.subscription.subscribe')[0];
    fireEvent.press(subscribeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('common.error', 'settings.subscription.error.purchaseFailed'); // Updated to match IAP flow
    });
  });

  it('displays error if creating customer portal session fails', async () => {
    (createStripeCustomerPortalSession as jest.Mock).mockResolvedValueOnce(null);
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.manageSubscription')).toBeVisible());

    const manageButton = screen.getByText('settings.subscription.manageSubscription');
    fireEvent.press(manageButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('common.error', 'settings.subscription.error.noPortalUrl');
    });
  });
});
