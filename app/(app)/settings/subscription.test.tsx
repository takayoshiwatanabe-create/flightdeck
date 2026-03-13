import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SubscriptionScreen from './subscription';
import { useTheme } from '@/components/ThemeProvider';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';

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
  useLocale: jest.fn(() => 'en'),
}));

// Mock the fetch calls for subscription status and Stripe portal/checkout
const mockFetchSubscriptionStatus = jest.fn();
const mockCreateStripeCheckoutSession = jest.fn();
const mockCreateStripeCustomerPortalSession = jest.fn();

jest.mock('../../../src/lib/actions/stripe', () => ({
  fetchSubscriptionStatus: () => mockFetchSubscriptionStatus(),
  createStripeCheckoutSession: (priceId: string) => mockCreateStripeCheckoutSession(priceId),
  createStripeCustomerPortalSession: () => mockCreateStripeCustomerPortalSession(),
}));

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggleTheme: jest.fn() });
    (useLocale as jest.Mock).mockReturnValue('en');
    mockFetchSubscriptionStatus.mockResolvedValue({ isPremium: false, currentPeriodEnd: null });
    mockCreateStripeCheckoutSession.mockResolvedValue({ url: 'https://mock-checkout.stripe.com' });
    mockCreateStripeCustomerPortalSession.mockResolvedValue({ url: 'https://mock-portal.stripe.com' });
    // Reset Platform.OS to default for each test
    Object.defineProperty(Platform, 'OS', { get: () => 'ios' });
  });

  it('renders loading state initially', () => {
    mockFetchSubscriptionStatus.mockReturnValueOnce(new Promise(() => {})); // Never resolve
    render(<SubscriptionScreen />);
    expect(screen.getByText('settings.subscription.loading')).toBeVisible();
    expect(screen.getByA11yLabel('Loading')).toBeVisible();
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
    mockFetchSubscriptionStatus.mockResolvedValueOnce({ isPremium: true, currentPeriodEnd: premiumEndDate });
    render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(screen.getByText('settings.subscription.status.premium')).toBeVisible();
      // toLocaleDateString depends on the environment's locale, so we mock it for consistency
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
      expect(mockCreateStripeCustomerPortalSession).toHaveBeenCalled();
      // For web, window.location.href is directly set, not Linking.openURL
      // We need to mock window.location.href for this test
      // @ts-expect-error - window.location is read-only, but we can mock it for testing
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: '' }; // Mock window.location
      
      // The Alert.alert is called for both native and web, but the action is different.
      // For web, the onPress of the 'OK' button should set window.location.href
      const okButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
      okButton.onPress(); // This will trigger the navigation
      expect(window.location.href).toBe('https://mock-portal.stripe.com');

      // Restore original window.location
      (window as any).location = originalLocation;
    });
  });

  it('handles "Manage Subscription" button press for native platform', async () => {
    Object.defineProperty(Platform, 'OS', { get: () => 'ios' });
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.manageSubscription')).toBeVisible());

    const manageButton = screen.getByText('settings.subscription.manageSubscription');
    fireEvent.press(manageButton);

    await waitFor(() => {
      expect(mockCreateStripeCustomerPortalSession).toHaveBeenCalled();
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

    // Simulate pressing 'OK' on the alert
    const okButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
    okButton.onPress();
    expect(Linking.openURL).toHaveBeenCalledWith('https://mock-portal.stripe.com');
  });

  it('handles "Subscribe" button press for monthly plan', async () => {
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.monthlyPlan')).toBeVisible());

    const subscribeButton = screen.getAllByText('settings.subscription.subscribe')[0]; // Get the first subscribe button (monthly)
    fireEvent.press(subscribeButton);

    await waitFor(() => {
      expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith('price_123monthly');
      expect(Alert.alert).toHaveBeenCalledWith(
        'settings.subscription.subscribe',
        'settings.subscription.redirectingToStripe',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'common.ok',
            onPress: expect.any(Function),
          }),
        ])
      );
    });

    // Simulate pressing 'OK' on the alert
    const okButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
    okButton.onPress();
    expect(Linking.openURL).toHaveBeenCalledWith('https://mock-checkout.stripe.com');
  });

  it('displays error if fetching subscription status fails', async () => {
    mockFetchSubscriptionStatus.mockRejectedValueOnce(new Error('API Error'));
    render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(screen.getByText('settings.subscription.error.fetchFailed')).toBeVisible();
    });
  });

  it('displays error if creating checkout session fails', async () => {
    mockCreateStripeCheckoutSession.mockResolvedValueOnce(null); // Simulate API returning null URL
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.monthlyPlan')).toBeVisible());

    const subscribeButton = screen.getAllByText('settings.subscription.subscribe')[0];
    fireEvent.press(subscribeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('common.error', 'settings.subscription.error.noCheckoutUrl');
    });
  });

  it('displays error if creating customer portal session fails', async () => {
    mockCreateStripeCustomerPortalSession.mockResolvedValueOnce(null); // Simulate API returning null URL
    render(<SubscriptionScreen />);
    await waitFor(() => expect(screen.getByText('settings.subscription.manageSubscription')).toBeVisible());

    const manageButton = screen.getByText('settings.subscription.manageSubscription');
    fireEvent.press(manageButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('common.error', 'settings.subscription.error.noPortalUrl');
    });
  });
});

