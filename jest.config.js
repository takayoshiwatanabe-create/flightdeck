module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFiles: [
    './jest.setup.js'
  ],
  setupFilesAfterEnv: [
    '@testing-library/react-native/extend-expect'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    "**/*.test.ts",
    "**/*.test.tsx"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/babel.config.js",
    "!**/jest.config.js",
    "!**/tailwind.config.js",
    "!**/app.json",
    "!**/expo-env.d.ts",
    "!**/next-env.d.ts",
    "!**/CLAUDE.md",
    "!**/src/lib/auth.ts", // NextAuth config, not unit-testable directly
    "!**/src/lib/prisma.ts", // Prisma client, not unit-testable directly
    "!**/src/lib/actions/auth.ts", // Integration with NextAuth, tested via screens
    "!**/src/lib/actions/user.ts", // Integration with Prisma, tested via screens
    "!**/src/lib/actions/stripe.ts", // Integration with Stripe, tested via screens
    "!**/src/lib/flightService.ts", // External API calls, mocked in tests
    "!**/app/_layout.tsx", // Root layout, mostly config
    "!**/app/(app)/_layout.tsx", // App layout, mostly config
    "!**/app/(auth)/_layout.tsx", // Auth layout, mostly config
    "!**/app/(tabs)/_layout.tsx", // Tabs layout, mostly config
    "!**/app/index.tsx", // Redirect logic
    "!**/components/ThemeProvider.tsx", // Context provider, tested via consumer
    "!**/components/ads/AdBanner.tsx", // External ad component
    "!**/components/flight-search-form.tsx", // Form component, tested via screen
    "!**/components/flight-list.tsx", // List component, tested via screen
    "!**/components/FlightCard.tsx", // Card component, tested via screen
    "!**/components/AuthForm.tsx", // Form component, tested via screen
    "!**/components/user-profile-form.tsx", // Form component, tested via screen
    "!**/i18n.ts", // i18n config
    "!**/middleware.ts", // Next.js middleware
    "!**/src/hooks/useTrackedFlights.ts", // Hook with async storage, tested via consumer
  ],
  coverageReporters: [
    "json-summary",
    "text",
    "lcov"
  ]
};

