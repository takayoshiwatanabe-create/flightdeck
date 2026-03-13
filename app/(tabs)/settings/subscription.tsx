import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, Platform } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import {
  fetchSubscriptionStatus,
  createStripeCheckoutSession, // This will be used for web, and to trigger IAP flow for native
  createStripeCustomerPortalSession,
} from '@/src/lib/actions/stripe';

interface SubscriptionStatus {
  isPremium: boolean;
  currentPeriodEnd: string | null;
}

export default function SubscriptionScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('settings.subscription');
  const tCommon = useTranslations('common');
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
        setError(t('error.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    }
    void loadSubscriptionStatus();
  }, []);

  const handleManageSubscription = async (): Promise<void> => {
    setIsRedirecting(true);
    try {
      const session = await createStripeCustomerPortalSession();
      if (session?.url) {
        if (Platform.OS === 'web') {
          // For web, redirect directly to Stripe Customer Portal
          window.location.href = session.url;
        } else {
          // For native, open in-app browser or external browser
          Alert.alert(t('manageSubscription'), t('redirectingToStripe'), [
            { text: tCommon('ok'), onPress: () => { void Linking.openURL(session.url); console.log('Redirecting to Stripe Customer Portal:', session.url); } }
          ]);
        }
      } else {
        Alert.alert(tCommon('error'), t('error.noPortalUrl'));
      }
    } catch (e: unknown) {
      console.error('Failed to create customer portal session:', e);
      Alert.alert(tCommon('error'), t('error.portalFailed'));
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleSubscribe = async (priceId: string): Promise<void> => {
    setIsRedirecting(true);
    try {
      if (Platform.OS === 'web') {
        const session = await createStripeCheckoutSession(priceId);
        if (session?.url) {
          window.location.href = session.url;
        } else {
          Alert.alert(tCommon('error'), t('error.noCheckoutUrl'));
        }
      } else {
        // For native (iOS/Android), use In-App Purchases (IAP) instead of Stripe Checkout direct link.
        // The `createStripeCheckoutSession` action is repurposed here to *initiate* the IAP flow
        // or to get necessary product identifiers from the backend.
        // IMPORTANT: Direct links to external payment systems like Stripe Checkout are NOT allowed by Apple/Google for digital goods.
        // You MUST use In-App Purchases (IAP) for native apps.
        console.log(`Initiating In-App Purchase for priceId: ${priceId}`);
        Alert.alert(t('subscribe'), t('initiatingPurchase'), [
          { text: tCommon('ok'), onPress: () => { /* Actual IAP logic would be here */ console.log('IAP flow initiated.'); } }
        ]);
        // Example: await InAppPurchases.purchaseProduct(priceId);
        // For now, we just simulate success. In a real app, this would involve
        // calling a native module and handling its callbacks.
        // If IAP fails, show an error: Alert.alert(tCommon('error'), t('error.purchaseFailed'));
      }
    } catch (e: unknown) {
      console.error('Failed to initiate subscription:', e);
      Alert.alert(tCommon('error'), t('error.purchaseFailed'));
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" accessibilityLabel="Loading" />
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
              onPress={() => void handleSubscribe('price_123monthly')} // Use actual Stripe Price ID or IAP product ID
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
              onPress={() => void handleSubscribe('price_456yearly')} // Use actual Stripe Price ID or IAP product ID
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

