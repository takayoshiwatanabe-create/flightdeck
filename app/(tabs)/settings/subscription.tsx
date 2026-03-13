import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking'; // Import Linking for opening URLs

export default function SubscriptionScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('subscription');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [isLoadingMonthly, setIsLoadingMonthly] = useState<boolean>(false);
  const [isLoadingYearly, setIsLoadingYearly] = useState<boolean>(false);

  // Function to call the Next.js API route to create a Stripe Checkout Session
  const createCheckoutSession = async (priceId: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, customerEmail: 'test@example.com' }), // Replace with actual user email
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create checkout session:', errorData);
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json() as { url: string };
      return data.url;
    } catch (error: unknown) {
      console.error('Error in createCheckoutSession:', error);
      return null;
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly'): Promise<void> => {
    // Price IDs from CLAUDE.md
    const priceId = plan === 'monthly' ? 'price_123_monthly' : 'price_456_yearly'; 
    
    if (plan === 'monthly') setIsLoadingMonthly(true);
    else setIsLoadingYearly(true);

    try {
      const checkoutUrl = await createCheckoutSession(priceId);
      if (checkoutUrl) {
        // Open the Stripe Checkout URL in the device's browser
        await Linking.openURL(checkoutUrl);
      } else {
        Alert.alert(tCommon('error'), t('checkout.error'));
      }
    } catch (error: unknown) {
      console.error('Subscription error:', error);
      Alert.alert(tCommon('error'), t('checkout.error'));
    } finally {
      setIsLoadingMonthly(false);
      setIsLoadingYearly(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        <Text style={[styles.backButtonText, { color: colors.text }]}>{tCommon('back')}</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>{t('title')}</Text>
      <Text style={[styles.description, { color: colors.secondaryText }]}>{t('description')}</Text>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.planTitle, { color: colors.text }]}>{t('monthlyPlan.title')}</Text>
        <Text style={[styles.price, { color: colors.text }]}>
          {t('monthlyPlan.price')}
          <Text style={[styles.priceUnit, { color: colors.secondaryText }]}>{t('monthlyPlan.unit')}</Text>
        </Text>
        <Text style={[styles.feature, { color: colors.secondaryText }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.accent} /> {t('monthlyPlan.feature1')}
        </Text>
        <Text style={[styles.feature, { color: colors.secondaryText }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.accent} /> {t('monthlyPlan.feature2')}
        </Text>
        <Pressable
          style={[styles.subscribeButton, { backgroundColor: colors.buttonBackground }]}
          onPress={() => void handleSubscribe('monthly')}
          disabled={isLoadingMonthly || isLoadingYearly}
          accessibilityLabel={t('monthlyPlan.button')}
        >
          {isLoadingMonthly ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.subscribeButtonText, { color: colors.buttonText }]}>
              {t('monthlyPlan.button')}
            </Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.planTitle, { color: colors.text }]}>{t('yearlyPlan.title')}</Text>
        <Text style={[styles.price, { color: colors.text }]}>
          {t('yearlyPlan.price')}
          <Text style={[styles.priceUnit, { color: colors.secondaryText }]}>{t('yearlyPlan.unit')}</Text>
        </Text>
        <Text style={[styles.feature, { color: colors.secondaryText }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.accent} /> {t('yearlyPlan.feature1')}
        </Text>
        <Text style={[styles.feature, { color: colors.secondaryText }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.accent} /> {t('yearlyPlan.feature2')}
        </Text>
        <Text style={[styles.feature, { color: colors.secondaryText }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.accent} /> {t('yearlyPlan.feature3')}
        </Text>
        <Pressable
          style={[styles.subscribeButton, { backgroundColor: colors.buttonBackground }]}
          onPress={() => void handleSubscribe('yearly')}
          disabled={isLoadingMonthly || isLoadingYearly}
          accessibilityLabel={t('yearlyPlan.button')}
        >
          {isLoadingYearly ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.subscribeButtonText, { color: colors.buttonText }]}>
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
    padding: 24,
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceUnit: {
    fontSize: 18,
    fontWeight: 'normal',
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscribeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
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
  buttonBackground: string;
  buttonText: string;
  accent: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
      cardBg: '#1F2937',
      border: '#374151',
      buttonBackground: '#22D3EE', // Cyan
      buttonText: '#1F2937',
      accent: '#34D399', // Emerald
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    buttonBackground: '#22D3EE', // Cyan
    buttonText: '#FFFFFF',
    accent: '#34D399', // Emerald
  };
}
