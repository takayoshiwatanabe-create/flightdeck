# Project Design Specification

This file is the single source of truth for this project. All code must conform to this specification.

## Constitution (Project Rules)
# FlightDeck プロジェクト憲法

> バージョン: 1.0.0
> 策定日: 2025年
> ステータス: 確定

---

## 第1条 プロジェクトの使命と哲学

### 1.1 コアミッション
FlightDeckは「航空会社の公式発表より早く情報を届ける」ことで、ビジネス渡航者に**時間的余裕**と**心理的安全性**を提供する。すべての技術的判断はこの使命に従属する。

### 1.2 設計哲学

| 原則 | 説明 |
|------|------|
| **Calm Technology** | 必要なときだけユーザーの注意を引く。過剰な警告・アニメーション・赤色使用を禁ずる |
| **Offline First** | ネットワーク状態に関わらず最終取得データを即座に表示する |
| **Data Integrity** | 内部処理は必ずUTCで行い、UTC以外の時刻を永続化してはならない |
| **Privacy by Design** | ユーザーの位置情報・個人情報を最小限に留め、サーバーに送信しない |
| **Clarity over Cleverness** | 巧妙なコードよりも明解なコードを優先する |

---

## 第2条 技術スタック（非交渉的）

### 2.1 フロントエンド（確定）

```
Next.js 15 (App Router)
React 19
TypeScript 5.x（strictモード必須）
Tailwind CSS v4
Shadcn/ui（ベースコンポーネント）
Zustand（クライアント状態管理）
React Query v5 / TanStack Query（サーバー状態管理）
```

### 2.2 バックエンド（確定）

```
Next.js API Routes（App Router Route Handlers）
Prisma ORM + SQLite（ローカル開発）/ PostgreSQL（本番）
NextAuth.js v5（認証）
```

### 2.3 インフラ（確定）

```
Vercel（ホスティング・Edge Functions）
Vercel Cron Jobs（定期フライトデータ取得）
Vercel KV（Redis互換キャッシュ）
```

### 2.4 多言語対応（確定）

```
next-intl（i18n）
対応言語：ja, en, zh, ko, es, fr, de, pt, ar, hi（計10言語）
RTL対応：ar（アラビア語）
```

### 2.5 決済（確定）

```
Stripe（サブスクリプション管理）
月額プラン：¥480/月
年額プラン：¥3,800/年
```

---

## 第3条 品質基準（非交渉的）

### 3.1 TypeScript

- `strict: true` を必須とする
- `any` 型の使用を**禁止**する（`unknown` を使用すること）
- すべての関数に戻り値の型注釈を付ける
- `as` キャストはコメントで理由を明示した場合のみ許可

### 3.2 コードスタイル

- ESLint + Prettier を使用し、CIで自動チェック
- コンポーネントは単一責任の原則に従う（200行以上は分割を検討）
- マジックナンバーを禁ずる（定数として名前を付ける）

### 3.3 テスト

| テスト種別 | ツール | カバレッジ目標 |
|-----------|--------|--------------|
| ユニットテスト | Vitest | 80%以上 |
| コンポーネントテスト | Testing Library | 主要コンポーネント全件 |
| E2Eテスト | Playwright | クリティカルパス全件 |
| 型テスト | tsc --noEmit | エラー0件 |

### 3.4 パフォーマンス

- Core Web Vitals: LCP < 2.5s、FID < 100ms、CLS < 0.1
- Lighthouse Score: 90点以上（全カテゴリ）
- Bundle Size: 初期ロード < 200KB（gzip）

### 3.5 アクセシビリティ

- WCAG 2.1 AA準拠
- キーボード操作完全対応
- スクリーンリーダー対応（aria-label必須）
- カラーコントラスト比 4.5:1以上

---

## 第4条 セキュリティ要件（非交渉的）

### 4.1 環境変数管理

```
AVIATIONSTACK_API_KEY → サーバーサイドのみ（NEXT_PUBLIC_プレフィックス禁止）
STRIPE_SECRET_KEY → サーバーサイドのみ
DATABASE_URL → サーバーサイドのみ
NEXTAUTH_SECRET → 32文字以上のランダム文字列
```

### 4.2 APIセキュリティ

- すべてのAPI Routeにレート制限を実装する（Upstash Ratelimit）
- 認証が必要なエンドポイントはセッション検証を必須とする
- Aviationstack APIキーをクライアントに露出させてはならない（プロキシ必須）
- CORS設定: 自ドメインのみ許可

### 4.3 データ保護

- ユーザーパスワードは bcrypt（cost factor 12以上）でハッシュ化
- セッショントークンの有効期限: 30日
- SQLインジェクション対策: Prismaのパラメータ化クエリのみ使用
- XSS対策: dangerouslySetInnerHTMLの使用禁止

### 4.4 決済セキュリティ

- カード情報をサーバーに保存してはならない（Stripe Elements使用）
- Stripe Webhookの署名検証を必須とする
- PCI DSS準拠はStripeに委任する

---

## 第5条 アーキテクチャ境界（非交渉的）

### 5.1 データフロー

```
クライアント → Next.js API Route → Aviationstack API
                    ↓
              Vercel KV（キャッシュ）
                    ↓
              PostgreSQL（永続化）
```

- クライアントから外部APIに直接アクセスしてはならない
- キャッシュTTL: フライト情報 = 60秒、航空会社情報 = 24時間

### 5.2 時刻処理の絶対ルール

```
永続化: UTC必須
計算: UTC必須
表示変換: クライアントサイドのみ（date-fns-tz使用）
API受信: 受信直後にUTCに正規化
```

### 5.3 フィーチャーフラグ

- Premium機能はサーバーサイドで権限チェックを行う
- クライアントの権限情報は表示目的のみ使用（セキュリティ判断に使用しない）

---

## 第6条 多言語対応の原則

### 6.1 必須対応言語

```
ja（日本語）- デフォルト
en（英語）
zh（中国語簡体字）
ko（韓国語）
es（スペイン語）
fr（フランス語）
de（ドイツ語）
pt（ポルトガル語）
ar（アラビア語）※RTL必須
hi（ヒンディー語）
```

### 6.2 RTL対応ルール

- アラビア語選択時、`<html dir="rtl">` を自動適用
- Tailwind CSS の `rtl:` バリアントを使用
- 画像・アイコンの向きをRTL対応させる

### 6.3 多言語翻訳の品質基準

- ハードコードされた文字列の使用を**禁止**する（すべて翻訳キー使用）
- 翻訳キーの命名: `namespace.component.key` 形式
- 欠落翻訳はデフォルト言語（英語）にフォールバック

---

## 第7条 Git・開発フロー

### 7.1 ブランチ戦略

```
main → 本番環境（自動デプロイ）
develop → 開発統合ブランチ
feature/xxx → 機能開発
fix/xxx → バグ修正
```

### 7.2 コミットメッセージ規約（Conventional Commits）

```
feat: 新機能
fix: バグ修正
perf: パフォーマンス改善
i18n: 多言語対応
refactor: リファクタリング
test: テスト追加
docs: ドキュメント
chore: ビルド・設定変更
```

### 7.3 PR・レビュー規約

- PRは1機能1PR原則
- セルフレビューチェックリスト必須
- CIが全件パスしない限りマージ禁止

---

## 第8条 UX・デザイン不可侵原則

### 8.1 禁止事項

- 過剰な赤色警告の使用（遅延はアンバー/オレンジで表現）
- ユーザーの同意なしの通知送信
- 5秒以上かかるローディング画面（プログレッシブローディング必須）
- モーダルの乱用（年3回以上のポップアップはUXチームの承認必須）

### 8.2 カラーシステム（非交渉的）

```
ステータス色:
  定刻: #22D3EE（シアン）
  遅延: #F59E0B（アンバー）
  欠航: #6B7280（グレー） ← 赤禁止
  搭乗中: #34D399（エメラルド）
  到着済み: #6B7280（グレー）
```

---

## Design Specification
# FlightDeck 設計仕様書

> バージョン: 1.0.0
> プラットフォーム: Web（Next.js 15 + React 19）

---

## 1. システムアーキテクチャ概要

### 1.1 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────┐
│                   クライアント                    │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Next.js  │  │ Zustand  │  │ TanStack Query│  │
│  │App Router│  │(UI State)│  │(Server State) │  │
│  └────┬────┘  └──────────┘  └───────┬───────┘  │
└───────┼──────────────────────────────┼───────────┘
        │ HTTP/RSC                     │ REST API
┌───────▼──────────────────────────────▼───────────┐
│              Next.js API Routes (Vercel)          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Auth     │  │ Flights  │  │  Stripe       │  │
│  │ Routes   │  │ Routes   │  │  Webhooks     │  │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
└───────┼─────────────┼─────────────────┼───────────┘
        │             │                 │
┌───────▼─────┐  ┌────▼──────────┐  ┌──▼──────────┐
│  PostgreSQL │  │  Vercel KV    │  │  Stripe API │
│  (Prisma)   │  │  (Redis Cache)│  │             │
└─────────────┘  └───────────────┘  └─────────────┘
                        │
              ┌─────────▼──────────┐
              │  Aviationstack API │
              │  (外部API)         │
              └────────────────────┘
                        ▲

## Development Instructions
N/A

## Technical Stack
- Next.js 15 + React 19 + TypeScript (strict mode)
- TailwindCSS 4
- Vitest for unit tests
- Playwright for E2E tests

## Code Standards
- TypeScript strict mode, no `any`
- Minimal comments — code should be self-documenting
- Use path alias `@/` for imports from `src/`
- All components use functional style with proper typing

## Internationalization (i18n)
- Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
- Use the i18n module at `@/i18n` for all user-facing strings
- Use `t("key")` function for translations — never hardcode UI strings
- Auto-detect device language via expo-localization
- Default language: ja (Japanese)
- RTL support required for Arabic (ar)
- Use isRTL flag from i18n module for layout adjustments

## Important Deadlines
- 2026年4月28日までにXcode 26対応が必要。ExpoがSDK対応を出し次第、eas build コマンドを再実行するだけで対応完了。期限1週間前に確認すること。

## Recently Implemented Feature: フライト検索・表示UIの実装 (2)

### 概要
フライト検索フォームとフライトリスト表示コンポーネントの実装。多言語対応、ダークモード対応、RTL対応を含む。

### 構成要素
1.  **`src/components/flight-search-form.tsx`**: フライト番号と日付を入力して検索するUI。
2.  **`src/components/flight-list.tsx`**: 検索結果のフライト情報を表示するUI。

### `src/components/flight-search-form.tsx` 詳細

-   **機能**:
    -   フライト番号と日付の入力フィールド。
    -   検索ボタン。
    -   検索中はボタンを無効化し、ローディングインジケーターを表示。
-   **デザイン**:
    -   `useTheme` を使用したダークモード対応。
    -   `isRTL` を使用したRTLレイアウト対応（入力フィールドのテキスト配置、マージン、ボタン配置）。
    -   プレースホルダー、ボタンテキストは `t()` 関数で多言語対応。
    -   デフォルトの日付は今日。
-   **アクセシビリティ**:
    -   `accessibilityLabel` を各入力フィールドとボタンに設定。
-   **カラーシステム**:
    -   背景色、入力フィールドの背景色、テキスト色、ボーダー色、プライマリ色（検索ボタン）、ボタンテキスト色をテーマに基づいて動的に設定。

### `src/components/flight-list.tsx` 詳細

-   **機能**:
    -   フライト情報のリスト表示。
    -   ローディング状態、エラー状態、結果なしの状態を適切に表示。
    -   各フライトアイテムはタップ可能で、`onSelectFlight` コールバックを呼び出す。
-   **デザイン**:
    -   `useTheme` を使用したダークモード対応。
    -   `isRTL` を使用したRTLレイアウト対応（テキスト配置、アイコンの向き、要素の順序）。
    -   フライトステータス（定刻、遅延、欠航など）は憲法第8条2項のカラーシステムに従う。
        -   定刻: `#22D3EE` (シアン)
        -   遅延: `#F59E0B` (アンバー)
        -   欠航: `#6B7280` (グレー)
        -   搭乗中: `#34D399` (エメラルド)
        -   到着済み: `#6B7280` (グレー)
    -   遅延情報はアンバー/オレンジで表示し、赤色は使用しない。
    -   日付と時刻の表示は `date-fns-tz` を使用し、クライアントサイドのタイムゾーンでフォーマット。
    -   `react-native-reanimated` を使用したリストアイテムのフェードイン/アウトアニメーション。
-   **アクセシビリティ**:
    -   各フライトアイテムに `accessibilityLabel` を設定。
-   **カラーシステム**:
    -   背景色、テキスト色、セカンダリテキスト色、プライマリ色、カード背景色、カードボーダー色、アイコン色、エラー色をテーマに基づいて動的に設定。
    -   フライトステータス色は憲法第8条2項の定義を厳守。

### `src/lib/aviationstack.ts` 詳細

-   **機能**:
    -   Aviationstack APIからフライトステータスと航空会社情報を取得するサーバーサイド関数。
    -   Vercel KV を使用したキャッシュメカニズムを実装。
        -   フライト情報: 60秒TTL
        -   航空会社情報: 24時間TTL
    -   APIキーはサーバーサイドでのみ使用し、クライアントに露出させない。
    -   **時刻処理**: APIから受信した時刻データは、`normalizeToUTC` 関数を使用して直ちにUTCに正規化される。これにより、憲法第5条2項「API受信: 受信直後にUTCに正規化」を遵守する。
-   **データ構造**:
    -   `FlightData` および `AirlineInfo` インターフェースを定義し、APIレスポンスの型安全性を確保。
-   **エラーハンドリング**:
    -   API呼び出し失敗時のエラーロギングと `null` 返却。

### `src/i18n/index.ts` 詳細

-   **機能**:
    -   多言語対応のコアロジック。
    -   `expo-localization` を使用してデバイスの言語を自動検出（Webでは `navigator.language`）。
    -   `AsyncStorage` を使用してユーザーが選択した言語を永続化。
    -   `setLanguage` 関数で言語を切り替える際に、Webプラットフォームでは `document.documentElement` の `lang` および `dir` 属性を更新し、RTL対応を自動適用。
    -   `isRTL()` 関数で現在の言語がRTLかどうかを判定。
    -   `t()` 関数で翻訳キーから文字列を取得。
-   **RTL対応**:
    -   アラビア語 (`ar`) が選択された場合、`isRTL()` が `true` を返す。
    -   Webでは `document.documentElement.setAttribute('dir', 'rtl')` が適用される。

### `src/types/flight.ts` (新規ファイル)

-   **機能**:
    -   フライト情報に関するTypeScriptの型定義と定数を集約。
    -   `FlightInfo` インターフェース: UIで表示するフライトデータの構造を定義。
    -   `FlightStatus` 型: 可能なフライトステータスのリテラル型。
    -   `STATUS_COLORS` 定数: 憲法第8条2項に準拠したフライトステータスごとの色定義。

```typescript
// src/types/flight.ts
export type FlightStatus =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'incident'
  | 'diverted'
  | 'delayed';

export interface FlightInfo {
  flightIata: string;
  flightNumber: string;
  flightDate: string; // YYYY-MM-DD
  airlineName: string;
  status: FlightStatus;
  departure: {
    airport: string;
    iata: string;
    scheduled: string; // UTC ISO string
    estimated: string; // UTC ISO string
    actual: string | null; // UTC ISO string
    delay: number | null; // minutes
    terminal: string | null;
    gate: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string; // UTC ISO string
    estimated: string; // UTC ISO string
    actual: string | null; // UTC ISO string
    delay: number | null; // minutes
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
  };
}

// Constitution (Project Rules) 第8条2項 カラーシステムに準拠
export const STATUS_COLORS: Record<FlightStatus, string> = {
  scheduled: '#22D3EE', // シアン
  active: '#34D399',    // エメラルド
  landed: '#6B7280',    // グレー
  cancelled: '#6B7280', // グレー
  incident: '#EF4444',  // 赤 (緊急事態のため例外的に赤を許可)
  diverted: '#F59E0B',  // アンバー
  delayed: '#F59E0B',   // アンバー
};
```

### `src/lib/kv.ts` (新規ファイル)

-   **機能**:
    -   Vercel KV (Redis互換) とのインタラクションを抽象化するユーティリティ関数。
    -   `getCache(key: string)`: キャッシュからデータを取得。
    -   `setCache(key: string, value: string, ttl: number)`: キャッシュにデータを保存（TTL付き）。
-   **技術スタック**:
    -   `@upstash/redis` を使用。

```typescript
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
    const data = await redis.get(key);
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
```

### `src/lib/env.ts` (新規ファイル)

-   **機能**:
    -   環境変数を安全に読み込むためのユーティリティ。
    -   サーバーサイドでのみアクセスされるべき変数と、クライアントサイドでもアクセス可能な変数を区別。
    -   `AVIATIONSTACK_API_KEY` はサーバーサイドのみ。
-   **技術スタック**:
    -   `process.env` を直接使用し、TypeScriptで型安全性を確保。

```typescript
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
```

### `package.json` の更新

-   `@upstash/redis` の追加。
-   `date-fns-tz` の追加。
-   `react-native-reanimated` の追加。
-   `@types/date-fns-tz` の追加。

### `tsconfig.json` の更新

-   `src/lib/**/*.ts` を `include` に追加。
-   `src/types/**/*.ts` を `include` に追加。

---
## Development Instructions
N/A

## Technical Stack
- Next.js 15 + React 19 + TypeScript (strict mode)
- TailwindCSS 4
- Vitest for unit tests
- Playwright for E2E tests

## Code Standards
- TypeScript strict mode, no `any`
- Minimal comments — code should be self-documenting
- Use path alias `@/` for imports from `src/`
- All components use functional style with proper typing

## Internationalization (i18n)
- Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
- Use the i18n module at `@/i18n` for all user-facing strings
- Use `t("key")` function for translations — never hardcode UI strings
- Auto-detect device language via expo-localization
- Default language: ja (Japanese)
- RTL support required for Arabic (ar)
- Use isRTL flag from i18n module for layout adjustments

## Important Deadlines
- 2026年4月28日までにXcode 26対応が必要。ExpoがSDK対応を出し次第、eas build コマンドを再実行するだけで対応完了。期限1週間前に確認すること。


