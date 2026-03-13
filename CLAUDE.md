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

### サブスクリプション管理（Stripe連携） (1)
- **ファイル:** `src/components/SubscriptionManager.tsx` (新規作成)
- **機能:**
    - ユーザーの現在のサブスクリプション状態を表示 (Premium/Free)
    - サブスクリプションの管理（Stripeカスタマーポータルへのリダイレクト）ボタン
    - サブスクリプションプランの表示（月額/年額）と選択ボタン
    - Stripe Checkoutへのリダイレクト（新規サブスクリプション作成）
- **デザイン:**
    - `Shadcn/ui` の `Card` コンポーネントをベースに、タイトル、説明、ボタンを配置。
    - サブスクリプション状態に応じてボタンの表示を切り替える。
    - プラン表示は明確に月額/年額を区別し、価格を表示。
    - カラーシステムは既存のテーマ（`ThemeProvider`）に準拠。
- **データフロー:**
    - ユーザーのサブスクリプション状態はAPI Route (`/api/user/subscription`) から取得。
    - StripeカスタマーポータルへのURLはAPI Route (`/api/stripe/customer-portal`) から取得。
    - Stripe Checkoutセッションの作成はAPI Route (`/api/stripe/checkout-session`) を経由。
- **セキュリティ:**
    - Stripe APIキーはサーバーサイドのみで使用し、クライアントに露出させない。
    - Webhookの署名検証を必須とする。
    - クライアントからのリクエストは認証済みユーザーのみ許可。
- **多言語対応:**
    - すべての表示文字列は `next-intl` を使用して翻訳する。
    - 翻訳キーの例: `settings.subscription.title`, `settings.subscription.status.premium`, `settings.subscription.manage`, `settings.subscription.monthlyPlan`, `settings.subscription.yearlyPlan`, `settings.subscription.subscribe`
- **価格:**
    - 月額プラン: ¥480/月
    - 年額プラン: ¥3,800/年

---
## 2. UIコンポーネント詳細

### 2.1 AuthForm
- **ファイル:** `src/components/AuthForm.tsx`
- **機能:** ログイン/サインアップフォーム
- **デザイン:**
    - メールアドレス、パスワード入力フィールド
    - パスワード表示/非表示トグル
    - ログイン/サインアップボタン
    - Googleログインボタン
    - エラーメッセージ表示
- **多言語対応:**
    - `useTranslations('auth.form')` を使用。
    - `emailPlaceholder`, `passwordPlaceholder`, `showPassword`, `hidePassword`, `loading`, `or`, `googleLogin`, `error.*`
- **RTL対応:**
    - `useLocale()` を使用し、`isRTL` に応じて `textAlign` と `flexDirection` を調整。

### 2.2 FlightCard
- **ファイル:** `src/components/FlightCard.tsx`
- **機能:** 個々のフライト情報を表示するカード
- **デザイン:**
    - フライト番号、航空会社名、ステータス、出発/到着時刻、空港情報
    - 追跡/追跡解除ボタン
    - ステータスに応じた色分け（憲法8.2に準拠）
- **多言語対応:**
    - `useTranslations('flight')` を使用。
    - `terminal`, `gate`, `delay`, `track`, `untrack`, `status.*`
- **RTL対応:**
    - `useLocale()` を使用し、`isRTL` に応じて `flexDirection`, `marginStart`, `marginEnd`, `transform` を調整。

### 2.3 FlightList
- **ファイル:** `src/components/flight-list.tsx`
- **機能:** 検索結果や追跡中のフライトリストを表示
- **デザイン:**
    - `FlatList` を使用してフライトカードをレンダリング
    - ローディングインジケーター、エラーメッセージ、結果なしメッセージ
- **多言語対応:**
    - `useTranslations('flight.list')` を使用。
    - `loading`, `error.generic`, `noResults`

### 2.4 FlightSearchForm
- **ファイル:** `src/components/flight-search-form.tsx`
- **機能:** フライト検索入力フォーム
- **デザイン:**
    - フライト番号、日付入力フィールド
    - 検索ボタン
- **多言語対応:**
    - `useTranslations('search')` を使用。
    - `form.flightNumberPlaceholder`, `form.datePlaceholder`, `form.searchButton`
- **RTL対応:**
    - `useLocale()` を使用し、`isRTL` に応じて `textAlign`, `flexDirection`, `marginEnd`, `marginStart` を調整。

### 2.5 LanguageSwitcher
- **ファイル:** `src/components/language-switcher.tsx`
- **機能:** アプリケーションの言語を切り替えるUI
- **デザイン:**
    - サポートされている言語のリストを表示
    - 現在選択されている言語にチェックマーク
- **多言語対応:**
    - `useTranslations('settings')` を使用。
    - `language`, `selectLanguage`
- **RTL対応:**
    - `next-intl` のルートレイアウトで `dir` 属性が設定されるため、コンポーネント内での直接的なレイアウト調整は不要。

### 2.6 ThemeProvider
- **ファイル:** `src/components/ThemeProvider.tsx`
- **機能:** アプリケーション全体のテーマ（ライト/ダーク）を管理
- **デザイン:**
    - `useColorScheme` を使用してシステムテーマを検知
    - `AsyncStorage` でユーザー設定を永続化
    - `document.documentElement` の `data-theme` 属性と `dark` クラスをWeb版で制御
- **RTL対応:**
    - `ThemeProvider` はテーマ管理に特化し、RTL関連のDOM操作は `next-intl` のルートレイアウトに委譲する。

### 2.7 AdBanner
- **ファイル:** `src/components/ads/AdBanner.tsx`
- **機能:** Google Mobile Adsのバナー広告を表示
- **デザイン:**
    - `react-native-google-mobile-ads` を使用
    - Web版ではプレースホルダーを表示
- **多言語対応:**
    - 広告自体は多言語対応しないが、プレースホルダーテキストは翻訳可能。

### 2.8 RuokSplash
- **ファイル:** `src/components/RuokSplash.tsx`
- **機能:** アプリ起動時のスプラッシュスクリーン
- **デザイン:**
    - フェードイン/フェードアウトアニメーション
    - `ruok-splash.png` を表示
- **RTL対応:**
    - スプラッシュスクリーンは静的な画像表示のため、RTLによるレイアウト調整は不要。

---
## 3. Hooks詳細

### 3.1 useReviewPrompt
- **ファイル:** `src/hooks/useReviewPrompt.ts`
- **機能:** アプリ内レビュープロンプトの表示ロジック
- **デザイン:**
    - `expo-store-review` を使用
    - `AsyncStorage` で最終プロンプト日時を記録し、30日間隔で表示
- **多言語対応:** なし（システム提供のプロンプトを使用）

### 3.2 useTrackedFlights
- **ファイル:** `src/hooks/useTrackedFlights.ts`
- **機能:** ユーザーが追跡しているフライトの管理と詳細情報の取得
- **デザイン:**
    - `AsyncStorage` で追跡中のフライトリストを永続化
    - `TanStack Query` で各フライトの詳細情報をフェッチし、キャッシュ管理
- **データフロー:**
    - `getFlightByIata` を使用してフライト詳細を取得（これはAPI Route経由でAviationstackにアクセスする）
- **キャッシュTTL:** フライト情報 = 60秒

---
## 4. ユーティリティ・ライブラリ詳細

### 4.1 i18nモジュール
- **ファイル:** `src/i18n/index.ts` (クライアント用), `src/i18n/server.ts` (サーバー用)
- **機能:** `next-intl` の設定とエクスポート
- **多言語対応:**
    - `ja, en, zh, ko, es, fr, de, pt, ar, hi` をサポート
    - `src/i18n/dictionaries/*.json` に翻訳ファイルを配置
    - `useTranslations`, `useLocale` をエクスポート

### 4.2 Auth Actions
- **ファイル:** `src/lib/actions/auth.ts`
- **機能:** 認証ロジックのモック（ログイン、サインアップ）
- **セキュリティ:**
    - 実際の実装では `NextAuth.js` を使用し、サーバーサイドで安全に処理。

### 4.3 Aviationstack API Wrapper
- **ファイル:** `src/lib/aviationstack.ts`
- **機能:** Aviationstack APIとの通信ロジック（サーバーサイド専用）
- **セキュリティ:**
    - `AVIATIONSTACK_API_KEY` は環境変数から取得し、クライアントに露出させない。
    - Next.js API Route経由でのみ呼び出されることを想定。
- **データフロー:**
    - 取得したフライトデータを `FlightInfo` 型にマッピング。

### 4.4 Environment Variables
- **ファイル:** `src/lib/env.ts`
- **機能:** 環境変数の型定義と検証
- **セキュリティ:**
    - サーバーサイド専用の環境変数 (`AVIATIONSTACK_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `STRIPE_SECRET_KEY`, `DATABASE_URL`, `NEXTAUTH_SECRET`) を管理。
    - `NEXT_PUBLIC_` プレフィックスを持つ変数はクライアントサイドに露出するため、機密情報は含めない。

### 4.5 Flight Service
- **ファイル:** `src/lib/flightService.ts`
- **機能:** フライトデータの検索と取得（モックデータを使用）
- **データフロー:**
    - `searchFlights`, `getFlightByIata` 関数を提供。
    - 実際のアプリケーションでは、これらの関数はNext.js API Routeを介して `src/lib/aviationstack.ts` を呼び出す。
- **キャッシュTTL:** `useTrackedFlights` で60秒のキャッシュが設定される。

### 4.6 KV Store (Upstash Redis)
- **ファイル:** `src/lib/kv.ts`
- **機能:** Vercel KV (Upstash Redis) との連携
- **データフロー:**
    - `getCache`, `setCache` 関数を提供。
    - `env.UPSTASH_REDIS_REST_URL`, `env.UPSTASH_REDIS_REST_TOKEN` を使用。
- **キャッシュTTL:** フライト情報 = 60秒、航空会社情報 = 24時間

### 4.7 Rate Limiter (Upstash Ratelimit)
- **ファイル:** `src/lib/ratelimit.ts`
- **機能:** API Routeのレート制限
- **セキュリティ:**
    - `Upstash Ratelimit` を使用し、10秒間に10リクエストの制限を設定。
    - `env.UPSTASH_REDIS_REST_URL`, `env.UPSTASH_REDIS_REST_TOKEN` を使用。

### 4.8 Flight Types
- **ファイル:** `src/types/flight.ts`
- **機能:** フライト関連の型定義
- **デザイン:**
    - `FlightStatusType`, `AirportInfo`, `FlightInfo` インターフェースを定義。
    - `STATUS_COLORS` 定数を定義し、憲法8.2のカラーシステムに準拠。

### 4.9 Theme Types
- **ファイル:** `src/types/theme.ts`
- **機能:** テーマ関連の型定義
- **デザイン:**
    - `ColorScheme` 型 (`'light' | 'dark'`) を定義。

---
## 5. ルーティングとページ構成

### 5.1 認証ルート (`app/(auth)`)
- `app/(auth)/login.tsx`: ログイン画面
- `app/(auth)/signup.tsx`: 新規登録画面

### 5.2 メインアプリルート (`app/(app)`)
- `app/(app)/_layout.tsx`: タブナビゲーションレイアウト
- `app/(app)/index.tsx`: ホーム画面（追跡中のフライト表示）
- `app/(app)/search.tsx`: フライト検索画面
- `app/(app)/settings.tsx`: 設定画面
- `app/(app)/settings/language.tsx`: 言語選択画面
- `app/(app)/settings/subscription.tsx`: サブスクリプション管理画面 (新規追加)

### 5.3 ルートレイアウト
- `app/_layout.tsx`: アプリケーションの最上位レイアウト。`ThemeProvider`, `NextIntlClientProvider`, `QueryClientProvider` を含む。
- `app/not-found.tsx`: 404エラーページ

---
## 6. API Routes (Next.js App Router Route Handlers)

### 6.1 認証API
- `app/api/auth/[...nextauth]/route.ts`: NextAuth.jsの認証エンドポイント

### 6.2 フライト情報API
- `app/api/flights/search.ts`: フライト検索API
- `app/api/flights/[flightIata].ts`: 特定フライトの詳細取得API
    - `src/lib/aviationstack.ts` を呼び出し、Vercel KVでキャッシュ。

### 6.3 ユーザー関連API
- `app/api/user/subscription.ts`: ユーザーのサブスクリプション状態取得API

### 6.4 決済API (Stripe)
- `app/api/stripe/checkout-session.ts`: Stripe Checkoutセッション作成API
- `app/api/stripe/customer-portal.ts`: StripeカスタマーポータルURL取得API
- `app/api/stripe/webhook.ts`: Stripe Webhookハンドラー

---
## 7. Vercel Cron Jobs
- `api/cron/fetch-flight-data.ts`: 定期的にフライトデータを取得し、Vercel KVにキャッシュするジョブ。
    - 追跡中のフライトや人気路線のフライトデータを定期的に更新。

---
## 8. データベーススキーマ (Prisma + PostgreSQL)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  // NextAuth.js fields
  name          String?
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  // Subscription fields
  stripeCustomerId      String?   @unique // Stripe Customer ID
  stripeSubscriptionId  String?   @unique // Stripe Subscription ID
  stripePriceId         String?           // ID of the Stripe Price (plan)
  stripeCurrentPeriodEnd DateTime?        // End of the current subscription period
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Tracked flights for users (optional, could also be stored in KV or client-side)
// For simplicity, initially client-side (AsyncStorage) then move to DB for sync
model TrackedFlight {
  id          String   @id @default(cuid())
  userId      String
  flightIata  String
  flightDate  String // YYYY-MM-DD
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, flightIata, flightDate])
}
```
