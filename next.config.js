/** @type {import('next').NextConfig} */
const withPWA = require('@serwist/next').default({
  cacheOnFrontEndNav: true,
  swSrc: 'src/service-worker.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  // Other Serwist options
});

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Expo Router web build
  experimental: {
    appDir: true,
    forceSwcTransforms: true,
    // Required for Expo Router
    scrollRestoration: true,
    optimizeCss: true,
    nextScriptWorkers: true,
  },
  webpack: (config, { isServer }) => {
    // Required for Expo Router
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
      '@expo/vector-icons': 'expo-web-icons',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    if (isServer) {
      config.externals = [
        ...config.externals,
        // Exclude specific modules from server-side bundling if they cause issues
        // e.g., modules that rely on browser APIs
      ];
    }
    return config;
  },
  // Ensure images are handled correctly for web
  images: {
    disableStaticImages: true, // For Expo Router, static images are handled by Metro
  },
  // i18n configuration for next-intl
  i18n: {
    locales: ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'],
    defaultLocale: 'ja',
  },
};

module.exports = withPWA(nextConfig);

