import Constants from 'expo-constants';
import { Platform } from 'react-native'; // Import Platform

interface Env {
  AVIATIONSTACK_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  // Add AdMob App IDs as public variables for client-side
  NEXT_PUBLIC_ADMOB_ANDROID_APP_ID: string;
  NEXT_PUBLIC_ADMOB_IOS_APP_ID: string;
}

// Determine if running on server or client
const isServer = typeof window === 'undefined';

// For Expo, environment variables are typically managed via app.json or .env files
// and accessed via ExpoConstants.
// For Next.js, process.env is used.
// This combines both for a universal app approach.
const rawEnv: Record<string, unknown> = {
  ...process.env, // For Next.js server-side and client-side (NEXT_PUBLIC_ prefixed)
  ...Constants.expoConfig?.extra, // For Expo client-side
};

// Ensure all required environment variables are present
function validateEnv(config: Record<string, unknown>, isServer: boolean): Env {
  const errors: string[] = [];

  const serverOnlyVars: Array<keyof Env> = [
    'AVIATIONSTACK_API_KEY',
    'STRIPE_SECRET_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];
  const clientPublicVars: Array<keyof Env> = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_ADMOB_ANDROID_APP_ID',
    'NEXT_PUBLIC_ADMOB_IOS_APP_ID',
  ];

  // Validate server-side variables
  if (isServer) {
    for (const key of serverOnlyVars) {
      const value = config[key];
      if (value === undefined || value === '') {
        errors.push(`Missing server-side environment variable: ${key}`);
      }
    }
  }

  // Validate client-side public variables
  // For Next.js client, it's process.env.NEXT_PUBLIC_...
  // For Expo client, it's Constants.expoConfig?.extra[key]
  for (const key of clientPublicVars) {
    // Check both process.env (for Next.js) and Constants.expoConfig.extra (for Expo)
    const value = config[key] ?? (Constants.expoConfig?.extra as Record<string, unknown>)?.[key];
    if (value === undefined || value === '') {
      errors.push(`Missing client-side public environment variable: ${key}`);
    }
  }

  // Ensure AVIATIONSTACK_API_KEY is NOT exposed client-side
  // This check needs to be robust for both Next.js and Expo client environments.
  if (!isServer) {
    // Check process.env for Next.js client
    if (process.env.AVIATIONSTACK_API_KEY !== undefined && process.env.AVIATIONSTACK_API_KEY !== '') {
      errors.push('Security Error: AVIATIONSTACK_API_KEY must not be exposed client-side via process.env.');
    }
    // Check Constants.expoConfig.extra for Expo client
    if ((Constants.expoConfig?.extra as Record<string, unknown>)?.AVIATIONSTACK_API_KEY !== undefined && (Constants.expoConfig?.extra as Record<string, unknown>)?.AVIATIONSTACK_API_KEY !== '') {
      errors.push('Security Error: AVIATIONSTACK_API_KEY must not be exposed client-side via Expo config.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment variable validation failed:\n${errors.join('\n')}`);
  }

  // Extract values, prioritizing direct properties (e.g., from process.env in Next.js)
  // then falling back to expoConfig.extra for Expo.
  const getVar = (key: keyof Env): string => {
    const value = (config[key] ?? (Constants.expoConfig?.extra as Record<string, unknown>)?.[key]) as string | undefined;
    if (value === undefined) {
      // This case should ideally be caught by validateEnv, but for type safety
      throw new Error(`Environment variable ${key} is undefined after validation.`);
    }
    return value;
  };

  return {
    AVIATIONSTACK_API_KEY: getVar('AVIATIONSTACK_API_KEY'),
    STRIPE_SECRET_KEY: getVar('STRIPE_SECRET_KEY'),
    DATABASE_URL: getVar('DATABASE_URL'),
    NEXTAUTH_SECRET: getVar('NEXTAUTH_SECRET'),
    UPSTASH_REDIS_REST_URL: getVar('UPSTASH_REDIS_REST_URL'),
    UPSTASH_REDIS_REST_TOKEN: getVar('UPSTASH_REDIS_REST_TOKEN'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_ADMOB_ANDROID_APP_ID: getVar('NEXT_PUBLIC_ADMOB_ANDROID_APP_ID'),
    NEXT_PUBLIC_ADMOB_IOS_APP_ID: getVar('NEXT_PUBLIC_ADMOB_IOS_APP_ID'),
  };
}

export const env: Env = validateEnv(rawEnv, isServer);

