import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

// Mock user session for testing purposes
const mockUserSession = {
  email: 'test@example.com',
  id: 'user_123',
};

export default function SubscriptionScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('subscription');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [isSubscribingMonthly, setIsSubscribingMonthly] = useState<boolean>(false);
  const [isSubscribingYearly, setIsSubscribingYearly] = useState<boolean>(false);

  const handleSubscribe = async (priceId: string, planType: 'monthly' | 'yearly'): Promise<void> => {
    if (!mockUserSession?.email) {
      Alert.alert(tCommon('error'), t('checkout.noUserEmail'));
      return;
    }

    if (planType === 'monthly') {
      setIsSubscribingMonthly(true);
    } else {
      setIsSubscribingYearly(true);
    }

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, customerEmail: mockUserSession.email }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        if (Platform.OS === 'web') {
          window.location.href = data.url;
        } else {
          Alert.alert(
            tCommon('ok'),
            t('checkout.redirecting'),
            [{ text: tCommon('ok'), onPress: () => { void Linking.openURL(data.url); } }]
          );
        }
      } else {
        Alert.alert(tCommon('error'), t('checkout.error'));
        console.error('Failed to create Stripe Checkout session:', data.message || 'Unknown error');
      }
    } catch (error: unknown) {
      Alert.alert(tCommon('error'), t('checkout.error'));
      console.error('Network or unexpected error creating checkout session:', error);
    } finally {
      setIsSubscribingMonthly(false);
      setIsSubscribingYearly(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel={tCommon('back')}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        <Text style={[styles.backButtonText, { color: colors.text }]}>{tCommon('back')}</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>{t('title')}</Text>
      <Text style={[styles.description, { color: colors.secondaryText }]}>{t('description')}</Text>

      <View style={[styles.planCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.planTitle, { color: colors.text }]}>{t('monthlyPlan.title')}</Text>
        <Text style={[styles.planPrice, { color: colors.text }]}>{t('monthlyPlan.price')}</Text>
        <Text style={[styles.planFeatures, { color: colors.secondaryText }]}>{t('monthlyPlan.features')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.subscribeButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isSubscribingMonthly ? 0.7 : 1,
            },
          ]}
          onPress={() => void handleSubscribe('price_123_monthly', 'monthly')} // Replace with actual Stripe Price ID
          disabled={isSubscribingMonthly}
          accessibilityLabel={t('monthlyPlan.button')}
        >
          {isSubscribingMonthly ? (
            <ActivityIndicator color={colors.buttonText} accessibilityLabel="Loading" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {t('monthlyPlan.button')}
            </Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.planCard, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 20 }]}>
        <Text style={[styles.planTitle, { color: colors.text }]}>{t('yearlyPlan.title')}</Text>
        <Text style={[styles.planPrice, { color: colors.text }]}>{t('yearlyPlan.price')}</Text>
        <Text style={[styles.planFeatures, { color: colors.secondaryText }]}>{t('yearlyPlan.features')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.subscribeButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isSubscribingYearly ? 0.7 : 1,
            },
          ]}
          onPress={() => void handleSubscribe('price_456_yearly', 'yearly')} // Replace with actual Stripe Price ID
          disabled={isSubscribingYearly}
          accessibilityLabel={t('yearlyPlan.button')}
        >
          {isSubscribingYearly ? (
            <ActivityIndicator color={colors.buttonText} accessibilityLabel="Loading" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {t('yearlyPlan.button')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  planCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  planFeatures: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  subscribeButton: {
    width: '100%',
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
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  cardBg: string;
  border: string;
  primary: string;
  buttonText: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
      cardBg: '#1F2937',
      border: '#374151',
      primary: '#22D3EE', // Cyan
      buttonText: '#1F2937', // Dark Gray
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#22D3EE', // Cyan
    buttonText: '#FFFFFF', // White
  };
}

