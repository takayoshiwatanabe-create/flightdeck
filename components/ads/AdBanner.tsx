import React from 'react';
import { Platform, StyleSheet, View } from 'react-native'; // Import View
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { isRTL } from '@/i18n'; // Import isRTL from i18n

const BANNER_ID: string = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    }) ?? TestIds.ADAPTIVE_BANNER;

export function AdBanner(): JSX.Element {
  // BannerAd does not directly support a 'style' prop for RTL.
  // Instead, we wrap it in a View and apply the style to the View.
  const rtlStyle = isRTL() ? { direction: 'rtl' as const } : {};

  return (
    <View style={[styles.adContainer, rtlStyle]}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Add any other styling needed for the ad container
  },
});

