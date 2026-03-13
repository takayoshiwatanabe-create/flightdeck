import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AdBanner } from './AdBanner';
import { useLocale } from 'next-intl';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Mock external dependencies
jest.mock('next-intl', () => ({
  useLocale: jest.fn(() => 'en'),
}));
jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: jest.fn(() => null), // Mock BannerAd component
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  },
  TestIds: {
    ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  },
}));

describe('AdBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocale as jest.Mock).mockReturnValue('en');
    // Mock BannerAd to return a simple component for testing
    (BannerAd as jest.Mock).mockImplementation((props) => (
      <mock-banner-ad {...props} testID="banner-ad" />
    ));
  });

  it('renders BannerAd component', () => {
    render(<AdBanner />);
    expect(screen.getByTestId('banner-ad')).toBeVisible();
  });

  it('passes correct unitId to BannerAd (TestIds in DEV)', () => {
    // Ensure __DEV__ is true for this test
    const originalDev = __DEV__;
    Object.defineProperty(global, '__DEV__', { value: true, writable: true });

    render(<AdBanner />);
    expect(screen.getByTestId('banner-ad')).toHaveProp('unitId', TestIds.ADAPTIVE_BANNER);

    Object.defineProperty(global, '__DEV__', { value: originalDev }); // Restore original __DEV__
  });

  it('passes correct unitId to BannerAd (production iOS)', () => {
    const originalDev = __DEV__;
    Object.defineProperty(global, '__DEV__', { value: false, writable: true });
    Object.defineProperty(global.Platform, 'OS', { get: () => 'ios' });

    render(<AdBanner />);
    // The mock unitId in AdBanner.tsx is 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' for iOS
    expect(screen.getByTestId('banner-ad')).toHaveProp('unitId', 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX');

    Object.defineProperty(global, '__DEV__', { value: originalDev });
  });

  it('passes correct unitId to BannerAd (production Android)', () => {
    const originalDev = __DEV__;
    Object.defineProperty(global, '__DEV__', { value: false, writable: true });
    Object.defineProperty(global.Platform, 'OS', { get: () => 'android' });

    render(<AdBanner />);
    // The mock unitId in AdBanner.tsx is 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' for Android
    expect(screen.getByTestId('banner-ad')).toHaveProp('unitId', 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX');

    Object.defineProperty(global, '__DEV__', { value: originalDev });
  });

  it('passes correct size to BannerAd', () => {
    render(<AdBanner />);
    expect(screen.getByTestId('banner-ad')).toHaveProp('size', BannerAdSize.ANCHORED_ADAPTIVE_BANNER);
  });

  it('passes correct requestOptions to BannerAd', () => {
    render(<AdBanner />);
    expect(screen.getByTestId('banner-ad')).toHaveProp('requestOptions', { requestNonPersonalizedAdsOnly: false });
  });

  it('applies rtl style for Arabic locale', () => {
    (useLocale as jest.Mock).mockReturnValue('ar');
    render(<AdBanner />);
    expect(screen.getByTestId('banner-ad').parent).toHaveStyle({ direction: 'rtl' });
  });

  it('applies ltr style for non-Arabic locale', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    render(<AdBanner />);
    expect(screen.getByTestId('banner-ad').parent).not.toHaveStyle({ direction: 'rtl' });
  });
});

