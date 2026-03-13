import React from 'react';
import { Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
// import { isRTL } from '@/i18n'; // Replaced by next-intl
import { useLocale } from 'next-intl'; // Import useLocale

const BANNER_ID: string = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: 'ca-app-pub-3940256099942544/2934735716', // Example iOS Ad Unit ID
      android: 'ca-app-pub-3940256099942544/6300978111', // Example Android Ad Unit ID
    }) ?? TestIds.ADAPTIVE_BANNER;

export function AdBanner(): JSX.Element {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr'; // Determine text direction

  return (
    <BannerAd
      unitId={BANNER_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      style={{ direction }} // Apply direction to the banner ad container
    />
  );
}
