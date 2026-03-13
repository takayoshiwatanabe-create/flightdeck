// src/lib/env.ts
// 環境変数の型定義
interface Env {
  AVIATIONSTACK_API_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  STRIPE_SECRET_KEY: string; // Added Stripe Secret Key
  STRIPE_WEBHOOK_SECRET: string; // Added Stripe Webhook Secret
  STRIPE_MONTHLY_PRICE_ID: string; // Added Stripe Monthly Price ID
  STRIPE_YEARLY_PRICE_ID: string; // Added Stripe Yearly Price ID
  NEXTAUTH_SECRET: string; // Added NextAuth Secret
  DATABASE_URL: string; // Added Database URL
}

// 環境変数を検証し、型安全なオブジェクトとしてエクスポート
// Next.jsの環境変数命名規則に従い、NEXT_PUBLIC_プレフィックスはクライアントサイド用
// サーバーサイドのみの変数はプレフィックスなし
const env: Env = {
  AVIATIONSTACK_API_KEY: process.env.AVIATIONSTACK_API_KEY ?? '',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID ?? '',
  STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID ?? '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
};

// 必須の環境変数が設定されているかチェック
// 開発時のみ警告を出すか、本番ではエラーをスローするなどのロジックを追加可能
if (process.env.NODE_ENV === 'development') {
  if (!env.AVIATIONSTACK_API_KEY) {
    console.warn('Warning: AVIATIONSTACK_API_KEY is not set.');
  }
  if (!env.UPSTASH_REDIS_REST_URL) {
    console.warn('Warning: UPSTASH_REDIS_REST_URL is not set.');
  }
  if (!env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Warning: UPSTASH_REDIS_REST_TOKEN is not set.');
  }
  if (!env.STRIPE_SECRET_KEY) {
    console.warn('Warning: STRIPE_SECRET_KEY is not set.');
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.warn('Warning: STRIPE_WEBHOOK_SECRET is not set.');
  }
  if (!env.STRIPE_MONTHLY_PRICE_ID) {
    console.warn('Warning: STRIPE_MONTHLY_PRICE_ID is not set.');
  }
  if (!env.STRIPE_YEARLY_PRICE_ID) {
    console.warn('Warning: STRIPE_YEARLY_PRICE_ID is not set.');
  }
  if (!env.NEXTAUTH_SECRET) {
    console.warn('Warning: NEXTAUTH_SECRET is not set.');
  }
  if (!env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL is not set.');
  }
}

export { env };
