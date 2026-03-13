import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxx/yyyyyyyyyyyy'; // Replace with your actual ad unit ID

export function AdBanner(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (Platform.OS === 'web') {
    // Web platform does not support react-native-google-mobile-ads
    // You might want to implement a web-specific ad solution here
    return (
      <View style={[styles.webAdPlaceholder, { backgroundColor: colors.adPlaceholderBg }]}>
        <Text style={{ color: colors.adPlaceholderText }}>Ad Placeholder (Web)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.error('Ad failed to load: ', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  webAdPlaceholder: {
    width: 320, // Standard banner width
    height: 50, // Standard banner height
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

function getColors(theme: ColorScheme): {
  adPlaceholderBg: string;
  adPlaceholderText: string;
} {
  if (theme === 'dark') {
    return {
      adPlaceholderBg: '#374151',
      adPlaceholderText: '#F9FAFB',
    };
  }
  return {
    adPlaceholderBg: '#E5E7EB',
    adPlaceholderText: '#1F2937',
  };
}
