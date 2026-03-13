// src/lib/env.ts
// 環境変数の型定義
interface Env {
  AVIATIONSTACK_API_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  // 他の環境変数もここに追加
}

// 環境変数を検証し、型安全なオブジェクトとしてエクスポート
// Next.jsの環境変数命名規則に従い、NEXT_PUBLIC_プレフィックスはクライアントサイド用
// サーバーサイドのみの変数はプレフィックスなし
const env: Env = {
  AVIATIONSTACK_API_KEY: process.env.AVIATIONSTACK_API_KEY ?? '',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
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
}

export { env };
