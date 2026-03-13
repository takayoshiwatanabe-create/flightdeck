import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, Platform } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking'; // Import Linking for opening URLs

// Mock API calls for subscription status and Stripe portal/checkout
interface SubscriptionStatus {
  isPremium: boolean;
  currentPeriodEnd: string | null;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  // Simulate API call
  await new Promise<void>(resolve => { setTimeout(resolve, 500); });
  // Mock data: randomly return premium or free status
  const isPremium = Math.random() > 0.5;
  const currentPeriodEnd = isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
  return { isPremium, currentPeriodEnd };
}

async function createStripeCheckoutSession(priceId: string): Promise<{ url: string } | null> {
  // Simulate API call to your backend
  await new Promise<void>(resolve => { setTimeout(resolve, 1000); });
  console.log(`Creating checkout session for price ID: ${priceId}`);
  // In a real app, this would call your Next.js API route: /api/stripe/checkout-session
  // and return the Stripe Checkout URL.
  // For mock, return a dummy URL.
  return { url: 'https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0' };
}

async function createStStripeCustomerPortalSession(): Promise<{ url: string } | null> {
  // Simulate API call to your backend
  await new Promise<void>(resolve => { setTimeout(resolve, 1000); });
  console.log('Creating customer portal session');
  // In a real app, this would call your Next.js API route: /api/stripe/customer-portal
  // and return the Stripe Customer Portal URL.
  // For mock, return a dummy URL.
  return { url: 'https://billing.stripe.com/p/login/test_aNodkE2d3e4f5g6h7i8j9k0l' };
}

export default function SubscriptionScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('settings.subscription');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscriptionStatus(): Promise<void> {
      try {
        setIsLoading(true);
        const status = await fetchSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (e: unknown) {
        console.error('Failed to fetch subscription status:', e);
        setError(t('error.fetchFailed')); // Assuming an error translation key
      } finally {
        setIsLoading(false);
      }
    }
    void loadSubscriptionStatus();
  }, []);

  const handleManageSubscription = async (): Promise<void> => {
    setIsRedirecting(true);
    try {
      const session = await createStStripeCustomerPortalSession();
      if (session?.url) {
        if (Platform.OS === 'web') {
          window.location.href = session.url;
        } else {
          // For native, use Linking to open the URL
          Alert.alert(t('manageSubscription'), t('redirectingToStripe'), [
            { text: t('common.ok'), onPress: () => { void Linking.openURL(session.url); console.log('Redirecting to:', session.url); } },
          ]);
        }
      } else {
        Alert.alert(t('error.generic'), t('error.noPortalUrl')); // Assuming error translation keys
      }
    } catch (e: unknown) {
      console.error('Failed to create customer portal session:', e);
      Alert.alert(t('error.generic'), t('error.portalFailed'));
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleSubscribe = async (priceId: string): Promise<void> => {
    setIsRedirecting(true);
    try {
      const session = await createStripeCheckoutSession(priceId);
      if (session?.url) {
        if (Platform.OS === 'web') {
          window.location.href = session.url;
        } else {
          Alert.alert(t('subscribe'), t('redirectingToStripe'), [
            { text: t('common.ok'), onPress: () => { void Linking.openURL(session.url); console.log('Redirecting to:', session.url); } },
          ]);
        }
      } else {
        Alert.alert(t('error.generic'), t('error.noCheckoutUrl')); // Assuming error translation keys
      }
    } catch (e: unknown) {
      console.error('Failed to create checkout session:', e);
      Alert.alert(t('error.generic'), t('error.checkoutFailed'));
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
      </View>
    );
  }

  const isPremium = subscriptionStatus?.isPremium ?? false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('title')}</Text>
        <View style={[styles.statusRow, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
          <MaterialCommunityIcons
            name={isPremium ? 'check-circle' : 'information'}
            size={24}
            color={isPremium ? '#34D399' : '#F59E0B'} // Emerald for premium, Amber for free
            style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isPremium ? t('status.premium') : t('status.free')}
          </Text>
        </View>
        {isPremium && subscriptionStatus?.currentPeriodEnd && (
          <Text style={[styles.periodEndText, { color: colors.secondaryText, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
            {t('currentPeriodEnd', { date: new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString(locale) })}
          </Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isRedirecting ? 0.7 : 1,
            },
          ]}
          onPress={() => void handleManageSubscription()}
          disabled={isRedirecting}
          accessibilityLabel={t('manageSubscription')}
        >
          {isRedirecting ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {t('manageSubscription')}
            </Text>
          )}
        </Pressable>
      </View>

      {!isPremium && (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('subscribe')}</Text>
          <View style={[styles.planOption, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
            <View style={[styles.planDetails, { alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.planName, { color: colors.text }]}>{t('monthlyPlan')}</Text>
              <Text style={[styles.planPrice, { color: colors.secondaryText }]}>{t('price.monthly')}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.subscribeButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || isRedirecting ? 0.7 : 1,
                },
              ]}
              onPress={() => void handleSubscribe('price_123monthly')} // Replace with actual Stripe Price ID
              disabled={isRedirecting}
              accessibilityLabel={t('subscribe')}
            >
              {isRedirecting ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                  {t('subscribe')}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.planOption, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row', marginTop: 15 }]}>
            <View style={[styles.planDetails, { alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.planName, { color: colors.text }]}>{t('yearlyPlan')}</Text>
              <Text style={[styles.planPrice, { color: colors.secondaryText }]}>{t('price.yearly')}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.subscribeButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || isRedirecting ? 0.7 : 1,
                },
              ]}
              onPress={() => void handleSubscribe('price_456yearly')} // Replace with actual Stripe Price ID
              disabled={isRedirecting}
              accessibilityLabel={t('subscribe')}
            >
              {isRedirecting ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                  {t('subscribe')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#EF4444',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  periodEndText: {
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 16,
    marginTop: 5,
  },
  subscribeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  cardBg: string;
  border: string;
  text: string;
  secondaryText: string;
  primary: string;
  buttonText: string;
  errorText: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      cardBg: '#1F2937',
      border: '#374151',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      primary: '#22D3EE',
      buttonText: '#1F2937',
      errorText: '#EF4444',
    };
  }
  return {
    background: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1F2937',
    secondaryText: '#6B7280',
    primary: '#22D3EE',
    buttonText: '#FFFFFF',
    errorText: '#EF4444',
    };
}
