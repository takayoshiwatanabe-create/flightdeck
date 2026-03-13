import { Redis } from '@upstash/redis';
import { env } from './env';

// Initialize Redis using the correct environment variables for Upstash Redis
export const kv = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Example usage (this would typically be in a server-side API route)
export async function setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds });
    console.log(`Cache set for key: ${key} with TTL: ${ttlSeconds}s`);
  } catch (error: unknown) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
}

export async function getCache(key: string): Promise<string | null> {
  try {
    const data: string | null = await kv.get<string>(key);
    if (data) {
      console.log(`Cache hit for key: ${key}`);
    } else {
      console.log(`Cache miss for key: ${key}`);
    }
    return data;
  } catch (error: unknown) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
}
