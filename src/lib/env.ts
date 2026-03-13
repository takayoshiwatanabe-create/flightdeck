import Constants from 'expo-constants';

interface Env {
  AVIATIONSTACK_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  // Vercel KV specific environment variables
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

// Ensure all required environment variables are present
function validateEnv(config: Record<string, unknown>): Env {
  const errors: string[] = [];

  const requiredVars: Array<keyof Env> = [
    'AVIATIONSTACK_API_KEY',
    'STRIPE_SECRET_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'UPSTASH_REDIS_REST_URL', // Added for Vercel KV
    'UPSTASH_REDIS_REST_TOKEN', // Added for Vercel KV
  ];

  for (const key of requiredVars) {
    // Check for both direct property and nested in extra
    if (config[key] === undefined && (config.extra as Record<string, unknown>)?.[key] === undefined) {
      errors.push(`Missing environment variable: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment variable validation failed:\n${errors.join('\n')}`);
  }

  // Extract values, prioritizing direct properties (e.g., from process.env in Next.js)
  // then falling back to expoConfig.extra for Expo.
  const getVar = (key: keyof Env): string => {
    const value = (config[key] ?? (config.extra as Record<string, unknown>)?.[key]) as string | undefined;
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
  };
}

// For Expo, environment variables are typically managed via app.json or .env files
// and accessed via ExpoConstants.
// This is a simplified example. In a real Next.js project, you'd use process.env directly.
// For a universal app, we need to consider both.
const rawEnv: Record<string, unknown> = {
  ...process.env, // For Next.js server-side
  ...Constants.expoConfig?.extra, // For Expo client-side
};

export const env: Env = validateEnv(rawEnv);
