import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env } from './env'; // Import env to get Upstash Redis credentials

// Initialize Upstash Redis client using environment variables from src/lib/env.ts
// This ensures consistency and validation.
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const RATELIMIT_WINDOW_SECONDS = 10;
const RATELIMIT_MAX_REQUESTS = 10;

// Create a new ratelimiter instance
// 10 requests per 10 seconds per IP address
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(RATELIMIT_MAX_REQUESTS, `${RATELIMIT_WINDOW_SECONDS}s`),
  analytics: true,
  /**
   * Optional: A key prefix for the ratelimiter.
   * By default, the ratelimiter uses a global key for all requests.
   * By providing a prefix, you can create different ratelimiters for different parts of your app.
   * For example, a ratelimiter for login attempts and another for API requests.
   */
  prefix: '@upstash/ratelimit',
});
