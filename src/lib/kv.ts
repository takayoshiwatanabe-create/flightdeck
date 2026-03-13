// src/lib/kv.ts
import { Redis } from '@upstash/redis';
import { env } from './env'; // 環境変数からRedis接続情報を取得

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * キャッシュからデータを取得します。
 * @param key キャッシュキー
 * @returns キャッシュされたデータ（文字列）またはnull
 */
export async function getCache(key: string): Promise<string | null> {
  try {
    const data: unknown = await redis.get(key); // Use unknown for initial type
    if (typeof data === 'string') {
      return data;
    }
    return null;
  } catch (error: unknown) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
}

/**
 * キャッシュにデータを保存します。
 * @param key キャッシュキー
 * @param value 保存するデータ（文字列）
 * @param ttl 有効期限（秒）
 */
export async function setCache(key: string, value: string, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, value);
  } catch (error: unknown) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
}
