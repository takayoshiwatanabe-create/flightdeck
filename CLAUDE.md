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

### Offline First Implementation Details

To achieve the "Offline First" principle (1.2 設計哲学), the following strategy will be implemented:

1.  **Client-side Caching for Tracked Flights**:
    *   **Mechanism**: `AsyncStorage` (for React Native) will be used to persist a list of `trackedFlights` (flightIata, flightDate).
    *   **Data Structure**: `trackedFlights` will be an array of objects `{ flightIata: string, flightDate: string }`.
    *   **Initial Load**: On app launch, `useTrackedFlights` hook will attempt to load `trackedFlights` from `AsyncStorage`.
    *   **Data Fetching**: For each `trackedFlight`, the app will attempt to fetch its latest `FlightInfo` from the API.
    *   **Offline Behavior**: If the API call fails (e.g., no network), the app will display the *last successfully fetched* `FlightInfo` for that `flightIata` from a separate `AsyncStorage` cache (`flight_details_cache`). If no cached data exists, a "No network / No data" message will be shown.
    *   **Cache Invalidation**: Flight details in `flight_details_cache` will have a TTL (Time-To-Live) of 60 seconds as per 5.1 データフロー. When fetching, if cached data is expired, a network request is made. If network fails, expired data can still be shown with a warning.
    *   **Update Strategy**: When new `FlightInfo` is successfully fetched, it will update both the UI and the `flight_details_cache` in `AsyncStorage`.

2.  **`useTrackedFlights` Hook Enhancement**:
    *   The existing `useTrackedFlights` hook will be extended to manage `flight_details_cache` in `AsyncStorage`.
    *   It will store `FlightInfo` objects keyed by `flightIata` in `AsyncStorage`.
    *   When `refreshDetails` is called or `trackedFlights` change, it will first check `flight_details_cache`. If data is present and not expired, it will be used. Otherwise, a network request will be made. If the network request fails, it will fall back to expired cached data if available.

3.  **UI Indications**:
    *   When displaying cached data due to offline mode or network errors, a subtle UI indicator (e.g., a small icon or text "Offline data") will be shown. This is to align with "Calm Technology" (1.2 設計哲学) and avoid excessive red warnings.

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

### Offline First Implementation Details

To achieve the "Offline First" principle (1.2 設計哲学), the following strategy will be implemented:

1.  **Client-side Caching for Tracked Flights**:
    *   **Mechanism**: `AsyncStorage` (for React Native) will be used to persist a list of `trackedFlights` (flightIata, flightDate).
    *   **Data Structure**: `trackedFlights` will be an array of objects `{ flightIata: string, flightDate: string }`.
    *   **Initial Load**: On app launch, `useTrackedFlights` hook will attempt to load `trackedFlights` from `AsyncStorage`.
    *   **Data Fetching**: For each `trackedFlight`, the app will attempt to fetch its latest `FlightInfo` from the API.
    *   **Offline Behavior**: If the API call fails (e.g., no network), the app will display the *last successfully fetched* `FlightInfo` for that `flightIata` from a separate `AsyncStorage` cache (`flight_details_cache`). If no cached data exists, a "No network / No data" message will be shown.
    *   **Cache Invalidation**: Flight details in `flight_details_cache` will have a TTL (Time-To-Live) of 60 seconds as per 5.1 データフロー. When fetching, if cached data is expired, a network request is made. If network fails, expired data can still be shown with a warning.
    *   **Update Strategy**: When new `FlightInfo` is successfully fetched, it will update both the UI and the `flight_details_cache` in `AsyncStorage`.

2.  **`useTrackedFlights` Hook Enhancement**:
    *   The existing `useTrackedFlights` hook will be extended to manage `flight_details_cache` in `AsyncStorage`.
    *   It will store `FlightInfo` objects keyed by `flightIata` in `AsyncStorage`.
    *   When `refreshDetails` is called or `trackedFlights` change, it will first check `flight_details_cache`. If data is present and not expired, it will be used. Otherwise, a network request will be made. If the network request fails, it will fall back to expired cached data if available.

3.  **UI Indications**:
    *   When displaying cached data due to offline mode or network errors, a subtle UI indicator (e.g., a small icon or text "Offline data") will be shown. This is to align with "Calm Technology" (1.2 設計哲学) and avoid excessive red warnings.

### Additional i18n Keys for Offline First

To support the UI indications for offline data, the following i18n keys need to be added:

-   `common.offlineDataWarning`: "Offline data (may be outdated)"
-   `common.noNetworkNoData`: "No network connection and no cached data available."

---
**Review Notes:**

The `CLAUDE.md` file has been updated to include the "Offline First Implementation Details" section, which outlines the strategy for client-side caching using `AsyncStorage` and enhancements to the `useTrackedFlights` hook. It also specifies UI indications for offline data, aligning with the "Calm Technology" principle.

Additionally, new i18n keys are proposed to support these UI indications. This ensures that all user-facing strings related to the offline-first feature are properly localized.
