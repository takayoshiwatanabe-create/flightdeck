import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { Card } from '@/components/ui/card'; // Assuming shadcn/ui Card is adapted for RN
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui Button is adapted for RN
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SubscriptionStatus {
  isPremium: boolean;
  currentPlan: 'monthly' | 'yearly' | null;
  currentPeriodEnd: string | null; // ISO string
}

export function SubscriptionManager(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('settings.subscription');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isManaging, setIsManaging] = useState<boolean>(false);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call to /api/user/subscription
      // For now, mock data
      const mockStatus: SubscriptionStatus = {
        isPremium: false,
        currentPlan: null,
        currentPeriodEnd: null,
      };
      setStatus(mockStatus);
    } catch (e: unknown) {
      console.error('Failed to fetch subscription status:', e);
      setError(tCommon('error.generic')); // Assuming a generic error translation
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async (): Promise<void> => {
    setIsManaging(true);
    setError(null);
    try {
      // In a real app, this would be an API call to /api/stripe/customer-portal
      // which returns a URL to redirect to.
      // For now, simulate a redirect.
      console.log('Redirecting to Stripe Customer Portal...');
      // window.location.href = 'STRIPE_CUSTOMER_PORTAL_URL'; // For web
      Alert.alert(t('manageSubscription'), 'Redirecting to Stripe Customer Portal (mock)');
    } catch (e: unknown) {
      console.error('Failed to manage subscription:', e);
      setError(tCommon('error.generic'));
    } finally {
      setIsManaging(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly'): Promise<void> => {
    setIsSubscribing(true);
    setError(null);
    try {
      // In a real app, this would be an API call to /api/stripe/checkout-session
      // which returns a session URL to redirect to.
      // For now, simulate a redirect.
      console.log(`Subscribing to ${plan} plan...`);
      // window.location.href = 'STRIPE_CHECKOUT_SESSION_URL'; // For web
      Alert.alert(t('subscribe'), `Redirecting to Stripe Checkout for ${plan} plan (mock)`);
    } catch (e: unknown) {
      console.error('Failed to create checkout session:', e);
      setError(tCommon('error.generic'));
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
      <Card style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
          {t('title')}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.errorText, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
            {error}
          </Text>
        ) : (
          <View style={{ alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.statusText, { color: colors.secondaryText }]}>
              {status?.isPremium ? t('status.premium') : t('status.free')}
            </Text>
            {status?.isPremium && status.currentPeriodEnd && (
              <Text style={[styles.periodEndText, { color: colors.secondaryText }]}>
                {t('currentPeriodEnd', { date: new Date(status.currentPeriodEnd).toLocaleDateString(locale) })}
              </Text>
            )}

            {status?.isPremium ? (
              <Button
                onPress={() => void handleManageSubscription()}
                disabled={isManaging}
                style={[styles.button, { backgroundColor: colors.primary }]}
                textStyle={[styles.buttonText, { color: colors.buttonText }]}
              >
                {isManaging ? <ActivityIndicator color={colors.buttonText} /> : t('manage')}
              </Button>
            ) : (
              <View style={[styles.planContainer, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
                <Pressable
                  onPress={() => void handleSubscribe('monthly')}
                  disabled={isSubscribing}
                  style={({ pressed }) => [
                    styles.planButton,
                    {
                      backgroundColor: colors.planButtonBg,
                      borderColor: colors.planButtonBorder,
                      opacity: pressed || isSubscribing ? 0.7 : 1,
                      marginEnd: isRTL ? 0 : 10,
                      marginStart: isRTL ? 10 : 0,
                    },
                  ]}
                >
                  <Text style={[styles.planTitle, { color: colors.text, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
                    {t('monthlyPlan')}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.primary, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
                    {t('price.monthly')}
                  </Text>
                  {isSubscribing && <ActivityIndicator size="small" color={colors.primary} style={styles.planLoader} />}
                </Pressable>
                <Pressable
                  onPress={() => void handleSubscribe('yearly')}
                  disabled={isSubscribing}
                  style={({ pressed }) => [
                    styles.planButton,
                    {
                      backgroundColor: colors.planButtonBg,
                      borderColor: colors.planButtonBorder,
                      opacity: pressed || isSubscribing ? 0.7 : 1,
                      marginEnd: isRTL ? 0 : 10,
                      marginStart: isRTL ? 10 : 0,
                    },
                  ]}
                >
                  <Text style={[styles.planTitle, { color: colors.text, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
                    {t('yearlyPlan')}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.primary, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
                    {t('price.yearly')}
                  </Text>
                  {isSubscribing && <ActivityIndicator size="small" color={colors.primary} style={styles.planLoader} />}
                </Pressable>
              </View>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  periodEndText: {
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  planButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  planLoader: {
    marginTop: 10,
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
  planButtonBg: string;
  planButtonBorder: string;
} {
  if (theme === 'dark') {
    return {
      background: '#1F2937',
      cardBg: '#2D3748',
      border: '#4A5568',
      text: '#F9FAFB',
      secondaryText: '#CBD5E0',
      primary: '#22D3EE',
      buttonText: '#1F2937',
      errorText: '#EF4444',
      planButtonBg: '#1F2937',
      planButtonBorder: '#4A5568',
    };
  }
  return {
    background: '#F3F4F6',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1F2937',
    secondaryText: '#6B7280',
    primary: '#22D3EE',
    buttonText: '#FFFFFF',
    errorText: '#EF4444',
    planButtonBg: '#FFFFFF',
    planButtonBorder: '#D1D5DB',
    };
}
