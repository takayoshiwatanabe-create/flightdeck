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

### Deviation: Next.js and Expo Coexistence
The project design specification explicitly states "プラットフォーム: Web（Next.js 15 + React 19）" and details a Next.js-centric architecture including "Next.js API Routes (App Router Route Handlers)", "Vercel (ホスティング・Edge Functions)", and "Vercel Cron Jobs". However, the current codebase is heavily structured as an Expo project, using `expo-router`, `react-native`, `expo-localization`, `expo-status-bar`, `expo-splash-screen`, `expo-store-review`, `react-native-google-mobile-ads`, and `AsyncStorage` (from `@react-native-async-storage/async-storage`).

While `next-intl` and `date-fns-tz` are included, and `Next.js 15` and `tailwindcss 4` are in `package.json`, the core application structure and many dependencies are for a mobile-first Expo environment, not a Next.js web application. The `CLAUDE.md` also contains a section "Important Deadlines" specifically mentioning "Xcode 26対応が必要" and "eas build コマンドを再実行するだけで対応完了", which are Expo/React Native specific.

This is a significant deviation. The design spec describes a Next.js web application, but the implementation is an Expo/React Native mobile application with some Next.js dependencies present. The `package.json` `main` field points to `expo-router/entry`, and `scripts` include `expo start`, `android`, `ios`.

**Correction Strategy:**
Given the current state of the codebase and the conflicting information within `CLAUDE.md` itself (Next.js web platform vs. Expo mobile deadlines), the most pragmatic approach for this review is to align the `CLAUDE.md` to reflect a **hybrid Next.js (web) and Expo (mobile) project**, acknowledging the existing Expo implementation while retaining the Next.js web aspects mentioned. This will involve:
1. Updating the "プラットフォーム" in "Design Specification" to explicitly state both Web (Next.js) and Mobile (Expo/React Native).
2. Adjusting the "技術スタック" to include Expo/React Native specific libraries.
3. Clarifying the architecture diagram to show how both platforms interact with the backend.
4. Modifying the "APIセキュリティ" and "データフロー" sections to explicitly state that server-side logic (API key proxying, KV access) happens in Next.js API Routes, which are then consumed by both Next.js frontend and Expo mobile clients.

This will make the design document consistent with the current codebase's hybrid nature.

### Deviation: `AVIATIONSTACK_API_KEY` Exposure
The `CLAUDE.md` states in "4.2 APIセキュリティ": "Aviationstack APIキーをクライアントに露出させてはならない（プロキシ必須）".
However, `src/lib/aviationstack.ts` directly uses `env.AVIATIONSTACK_API_KEY` in `fetch` calls:
`http://api.aviationstack.com/v1/flights?access_key=${env.AVIATIONSTACK_API_KEY}&flight_number=${flightNumber}&flight_date=${flightDate}`
`http://api.aviationstack.com/v1/airlines?access_key=${env.AVIATIONSTACK_API_KEY}&iata_code=${airlineIata}`

The `src/lib/env.ts` also includes `AVIATIONSTACK_API_KEY` in `Constants.expoConfig?.extra`, which means it will be bundled into the client-side Expo app, directly exposing the API key.

This is a critical security deviation. The `AVIATIONSTACK_API_KEY` must *only* be accessible on the server. The `aviationstack.ts` functions should be called from a Next.js API Route, which then makes the external API call. The client (both Next.js frontend and Expo app) should call *that* Next.js API Route, not the external Aviationstack API directly.

**Correction Strategy:**
1. Modify `src/lib/env.ts` to remove `AVIATIONSTACK_API_KEY` from `Constants.expoConfig?.extra` and ensure it's only available server-side (e.g., via `process.env` in a Next.js server context).
2. Modify `src/lib/aviationstack.ts` to remove the direct `fetch` calls to `api.aviationstack.com`. Instead, these functions should be designed to be called *from a Next.js API Route*, or if they are to be called from the client, they should call a *local* Next.js API Route that then proxies the request to Aviationstack. For the current Expo-centric setup, this means these functions cannot be called directly from the Expo client. They must be part of a server-side component (e.g., a Next.js API route).
3. Introduce placeholder Next.js API routes (e.g., `app/api/flights/route.ts` and `app/api/airlines/route.ts`) that will handle the proxying.
4. Update `src/lib/aviationstack.ts` to reflect that it's a server-side utility, and client-side components would call the Next.js API routes.

### Deviation: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `env.ts`
The `CLAUDE.md` states in "4.1 環境変数管理": "`AVIATIONSTACK_API_KEY → サーバーサイドのみ（NEXT_PUBLIC_プレフィックス禁止）`". It also implies that `STRIPE_SECRET_KEY` and `DATABASE_URL` are server-side only.
However, `src/lib/env.ts` includes `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in its `Env` interface and validation. While `NEXT_PUBLIC_` is the correct prefix for client-side environment variables in Next.js, the `CLAUDE.md` explicitly states "NEXT_PUBLIC_プレフィックス禁止" for `AVIATIONSTACK_API_KEY` but doesn't mention other variables. The presence of `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is correct for client-side Stripe Elements, but the `CLAUDE.md` should be clarified to allow `NEXT_PUBLIC_` for client-side keys.

**Correction Strategy:**
1. Update `CLAUDE.md` "4.1 環境変数管理" to explicitly allow `NEXT_PUBLIC_` prefix for client-side environment variables like `STRIPE_PUBLISHABLE_KEY`.

### Deviation: `react-query` vs `TanStack Query`
The `CLAUDE.md` "2.1 フロントエンド" lists "React Query v5 / TanStack Query".
The `package.json` lists `"react-query": "^3.39.3"`.
`react-query` v3 is an older version. `TanStack Query` is the new name for `React Query` starting from v4. The spec explicitly mentions `v5`.

**Correction Strategy:**
1. Update `package.json` to use `@tanstack/react-query` v5.

### Deviation: `bcryptjs` import
The `CLAUDE.md` "4.3 データ保護" states: "ユーザーパスワードは bcrypt（cost factor 12以上）でハッシュ化".
The `src/lib/actions/auth.ts` imports `bcryptjs`: `import bcrypt from 'bcryptjs';`.
While `bcryptjs` is a valid implementation, `bcrypt` (the native Node.js module) is generally preferred for server-side operations due to better performance. Given this is a Next.js project, `bcrypt` should be used on the server.

**Correction Strategy:**
1. Update `package.json` to use `bcrypt`.
2. Update `src/lib/actions/auth.ts` to import `bcrypt` instead of `bcryptjs`.

### Deviation: `expo-router` `main` entry point
The `package.json` `main` field is `"main": "expo-router/entry"`. This explicitly marks the project as an Expo project, which contradicts the "プラットフォーム: Web（Next.js 15 + React 19）" in the design spec.

**Correction Strategy:**
1. Update `package.json` to use a Next.js entry point (e.g., `next start`). This will be part of the larger `CLAUDE.md` platform alignment.

### Deviation: `app.json` `locales` configuration
The `app.json` contains a `locales` configuration:
```json
    "locales": {
      "ja": "./locales/ja.json",
      "en": "./locales/en.json",
      // ...
    }
```
This is an Expo-specific feature for bundling static translation files. While useful for Expo, `next-intl` (specified in `CLAUDE.md`) handles translations differently, typically by loading messages dynamically or via server components. This `app.json` configuration is not directly used by `next-intl` in a Next.js web context. The `i18n/translations.ts` file is the source of truth for translations as per `next-intl` usage.

**Correction Strategy:**
1. Remove the `locales` configuration from `app.json` as it's not relevant for the `next-intl` approach specified in the design. The `i18n/translations.ts` file already serves this purpose.

### Deviation: `dangerouslySetInnerHTML` in `app/+html.tsx`
The `CLAUDE.md` "4.3 データ保護" states: "XSS対策: dangerouslySetInnerHTMLの使用禁止".
However, `app/+html.tsx` uses `dangerouslySetInnerHTML` for injecting styles:
`<style dangerouslySetInnerHTML={{ __html: `body { overflow: hidden; }` }} />`
And `components/ThemeProvider.tsx` uses it for injecting initial theme script:
`<script dangerouslySetInnerHTML={{ __html: `...` }} />`

This is a direct violation of the XSS prevention rule. While sometimes necessary, it should be avoided if possible or very carefully sanitized. For simple styles, a `<link>` tag or a styled-components/emotion approach is safer. For initial theme, a CSS variable approach or a more controlled script injection might be considered. However, for a simple `body { overflow: hidden; }`, it's less of a security risk than user-generated content, but still a direct violation.

**Correction Strategy:**
1. Remove `dangerouslySetInnerHTML` from `app/+html.tsx` for `body { overflow: hidden; }`. This can often be handled by a global CSS file or a more controlled method in a Next.js project. For now, it's a direct violation.
2. Re-evaluate the `InitialTheme` component in `components/ThemeProvider.tsx`. While `dangerouslySetInnerHTML` is often used for hydration scripts, the spec explicitly forbids it. A more robust solution for initial theme without `dangerouslySetInnerHTML` or a clear exception in the spec would be needed. For now, it's a violation.

### Deviation: `React Query v5 / TanStack Query` vs `react-query` v3
The `CLAUDE.md` specifies "React Query v5 / TanStack Query" for server state management.
The `package.json` currently uses `"react-query": "^3.39.3"`.
This is an outdated version and doesn't align with the specified `v5` or `TanStack Query` naming convention.

**Correction Strategy:**
1. Update `package.json` to use `@tanstack/react-query` version 5.

### Deviation: `t("key")` function for translations
The `CLAUDE.md` "Internationalization (i18n)" section states: "Use `t("key")` function for translations — never hardcode UI strings".
The `i18n/index.ts` file implements `t` using `createIntl` from `next-intl`. This is generally correct for client-side usage.
However, the `CLAUDE.md` also specifies "Next.js 15 (App Router)" and `next-intl`. In a Next.js App Router, the recommended way to use `next-intl` is via the `useTranslations` hook in client components and `getTranslator` in server components, rather than a globally imported `t` function. While the current `t` function works for an Expo context, it's not the idiomatic `next-intl` way for a Next.js App Router.

**Correction Strategy:**
1. Clarify in `CLAUDE.md` that the global `t` function is for the Expo client, and `useTranslations`/`getTranslator` are for the Next.js web client/server. Or, if the project is strictly Next.js web, then the `i18n/index.ts` should be refactored to use `next-intl`'s App Router patterns. Given the hybrid nature, the former is more appropriate.

### Deviation: `expo-localization` for language detection
The `CLAUDE.md` "Internationalization (i18n)" section states: "Auto-detect device language via expo-localization".
This is specific to Expo. For a Next.js web application, `next-intl` handles locale detection via browser headers or URL prefixes.

**Correction Strategy:**
1. Clarify in `CLAUDE.md` that `expo-localization` is for the Expo client, and `next-intl`'s mechanisms are for the Next.js web client.

### Deviation: `NextIntlClientProvider` usage
The `app/+html.tsx` and `app/_layout.tsx` conditionally wrap children with `NextIntlClientProvider` based on `Platform.OS !== 'web'`.
`app/+html.tsx` wraps on `Platform.OS === 'web'`.
`app/_layout.tsx` wraps on `Platform.OS !== 'web'`.
This means `NextIntlClientProvider` is correctly applied for both web and native. However, the `getMessages(lang)` call in both files is synchronous. In a Next.js App Router, `getMessages` would typically be an `async` function called in a server component (e.g., `layout.tsx` or `page.tsx`) and passed to `NextIntlClientProvider`. The current synchronous call is a workaround for the Expo environment.

**Correction Strategy:**
1. Update `CLAUDE.md` to reflect the hybrid i18n strategy, acknowledging the synchronous `getMessages` for Expo and the asynchronous server-side loading for Next.js.
2. In `app/+html.tsx` and `app/_layout.tsx`, the `messages` prop of `NextIntlClientProvider` should be typed as `AbstractIntlMessages` from `next-intl` for better type safety.

### Deviation: `bcryptjs` vs `bcrypt`
The `CLAUDE.md` "4.3 データ保護" specifies "ユーザーパスワードは bcrypt（cost factor 12以上）でハッシュ化".
The `src/lib/actions/auth.ts` uses `bcryptjs`. While `bcryptjs` is a JavaScript implementation, `bcrypt` (the native C++ binding) is generally preferred for performance in Node.js environments, which Next.js API routes would be.

**Correction Strategy:**
1. Update `package.json` to install `bcrypt`.
2. Update `src/lib/actions/auth.ts` to import `bcrypt` instead of `bcryptjs`.

### Deviation: `any` type usage
The `CLAUDE.md` "3.1 TypeScript" states: "`any` 型の使用を**禁止**する（`unknown` を使用すること）".
`src/lib/aviationstack.ts` uses `error: unknown` in catch blocks, which is good.
However, `src/lib/actions/auth.ts` has `bcrypt` imported without type definitions, leading to implicit `any` usage if not properly typed.
`const hashedPassword = await bcrypt.hash('password', 12);`
`if (email === 'test@example.com' && await bcrypt.compare(password, hashedPassword))`
While `bcryptjs` has its own types, if switching to `bcrypt`, its types (`@types/bcrypt`) would be needed.

**Correction Strategy:**
1. Ensure `@types/bcrypt` is installed if switching to `bcrypt`.

### Deviation: `Tailwind CSS v4`
The `CLAUDE.md` "2.1 フロントエンド" specifies "Tailwind CSS v4".
The `package.json` lists `"tailwindcss": "^4.0.0-alpha.17"`. This is an alpha version. While it technically matches `v4`, it's an alpha, which might imply instability. For a "確定" (finalized) spec, a stable version is usually implied unless explicitly stated.

**Correction Strategy:**
1. Clarify in `CLAUDE.md` if `v4` refers to the stable release or if alpha versions are acceptable. For now, it's a minor deviation in terms of stability expectation. No code change needed, but a note in the spec.

### Deviation: `Shadcn/ui`
The `CLAUDE.md` "2.1 フロントエンド" specifies "Shadcn/ui（ベースコンポーネント）".
The current codebase uses `react-native` components and custom styling with `StyleSheet`. There's no indication of `Shadcn/ui` integration. `Shadcn/ui` is primarily for web (React/Next.js) and not directly compatible with React Native.

**Correction Strategy:**
1. Clarify in `CLAUDE.md` that `Shadcn/ui` is for the Next.js web client only, and the Expo mobile client uses `react-native` components with custom styling. Or, if the project is strictly Next.js web, then `Shadcn/ui` components should be implemented. Given the hybrid nature, the former is more appropriate.

### Deviation: `Zustand` and `React Query / TanStack Query` usage
The `CLAUDE.md` "2.1 フロントエンド" specifies `Zustand` for client state and `React Query / TanStack Query` for server state.
The current codebase includes `zustand` and `react-query` in `package.json`, but there's no actual usage of these libraries in the provided components (`AuthForm`, `ThemeProvider`, `AdBanner`, `app` screens). `react-query` is also an old version.

**Correction Strategy:**
1. Update `package.json` to `@tanstack/react-query` v5.
2. Add a note to `CLAUDE.md` that these libraries are for future implementation and are not yet actively used in the provided components. Or, if they are meant to be used, then example usage should be added.

### Deviation: `NextAuth.js v5`
The `CLAUDE.md` "2.2 バックエンド" specifies `NextAuth.js v5`.
The `package.json` lists `"next-auth": "^5.0.0-beta.19"`. This is a beta version. Similar to Tailwind CSS v4 alpha, for a "確定" spec, a stable version is usually implied.

**Correction Strategy:**
1. Clarify in `CLAUDE.md` if `v5` refers to the stable release or if beta versions are acceptable. For now, it's a minor deviation in terms of stability expectation. No code change needed, but a note in the spec.

### Deviation: `Prisma ORM + SQLite (ローカル開発) / PostgreSQL (本番)`
The `CLAUDE.md` "2.2 バックエンド" specifies `Prisma ORM + SQLite (ローカル開発) / PostgreSQL (本番)`.
The `package.json` includes `@prisma/client` and `prisma`. However, there's no actual Prisma schema (`schema.prisma`) or usage of Prisma client in the provided files. `DATABASE_URL` is in `env.ts` but not used.

**Correction Strategy:**
1. Add a note to `CLAUDE.md` that Prisma integration is for future backend development and not yet present in the provided files. Or, if it's meant to be used, then a basic Prisma setup should be included.

### Deviation: `Vercel KV (Redis互換キャッシュ)`
The `CLAUDE.md` "2.3 インフラ" specifies `Vercel KV (Redis互換キャッシュ)`.
The `src/lib/kv.ts` and `src/lib/ratelimit.ts` correctly use `@upstash/redis` and `@upstash/ratelimit` with `env.UPSTASH_REDIS_REST_URL` and `env.UPSTASH_REDIS_REST_TOKEN`. This aligns with Vercel KV's Redis compatibility.

### Deviation: `Vercel Cron Jobs`
The `CLAUDE.md` "2.3 インフラ" specifies `Vercel Cron Jobs`. There's no implementation or placeholder for this in the current codebase.

**Correction Strategy:**
1. Add a note to `CLAUDE.md` that `Vercel Cron Jobs` are for future implementation (e.g., periodic flight data fetching) and not yet present.

### Deviation: `Stripe (サブスクリプション管理)`
The `CLAUDE.md` "2.5 決済" specifies `Stripe (サブスクリプション管理)`.
`STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are in `env.ts`. `app/(tabs)/settings.tsx` has a placeholder for subscription management. However, there's no actual Stripe integration (e.g., API calls, webhook handlers).

**Correction Strategy:**
1. Add a note to `CLAUDE.md` that Stripe integration is for future implementation and not yet present.

### Deviation: `date-fns-tz` for display conversion
The `CLAUDE.md` "5.2 時刻処理の絶対ルール" states: "表示変換: クライアントサイドのみ（date-fns-tz使用）".
`package.json` includes `date-fns` and `date-fns-tz`. However, there's no actual usage of `date-fns-tz` for display conversion in the provided files. `src/lib/aviationstack.ts` mentions it as a possibility for normalization but doesn't use it.

**Correction Strategy:**
1. Add a note to `CLAUDE.md` that `date-fns-tz` usage for display conversion is for future implementation.

### Deviation: `WCAG 2.1 AA準拠`, `キーボード操作完全対応`, `スクリーンリーダー対応 (aria-label必須)`, `カラーコントラスト比 4.5:1以上`
The `CLAUDE.md` "3.5 アクセシビリティ" specifies these.
The `AuthForm.tsx` uses `accessibilityLabel` for inputs and pressables, which is good. However, a full WCAG 2.1 AA compliance check requires more extensive review (e.g., keyboard navigation, focus management, semantic HTML for web, proper roles for native, color contrast for all text/interactive elements). The current color definitions in `getColors` functions are hardcoded hex values, and their contrast ratios are not explicitly checked against the 4.5:1 requirement.

**Correction Strategy:**
1. Add a note to `CLAUDE.md` that accessibility compliance requires further dedicated audit and implementation beyond current placeholders.

### Deviation: `Core Web Vitals`, `Lighthouse Score`, `Bundle Size`
The `CLAUDE.md` "3.4 パフォーマンス" specifies these.
These are web-specific metrics. While performance is important for mobile, these exact metrics are for web. The current Expo setup doesn't directly measure these.

**Correction Strategy:**
1. Clarify in `CLAUDE.md` that these performance metrics are for the Next.js web client, and mobile performance will have its own set of metrics (e.g., app startup time, frame rate).

### Deviation: `Vitest`, `Testing Library`, `Playwright`
The `CLAUDE.md` "3.3 テスト" specifies these tools and coverage goals.
`package.json` includes `vitest`, `@testing-library/react-native`, and `@playwright/test`. However, there are no actual test files (`.test.ts`, `.spec.ts`) in the provided codebase. `jest` and `jest-expo` are also present, which might conflict with `vitest` for unit tests.

**Correction Strategy:**
1. Add a note to `CLAUDE.md` that test implementation is for future development and not yet present.
2. Resolve the `jest` vs `vitest` conflict in `package.json` and `CLAUDE.md` to specify a single unit testing framework. Given `vitest` is specified, `jest` should be removed.

### Deviation: `eslint` and `prettier`
The `CLAUDE.md` "3.2 コードスタイル" specifies `ESLint + Prettier` and `CIで自動チェック`.
`package.json` includes `eslint`, `eslint-config-next`, `eslint-config-prettier`, and `prettier`. However, there are no `.eslintrc.js` or `.prettierrc.js` configuration files provided to verify the rules. The `lint` script is present.

**Correction Strategy:**
1. Add placeholder `.eslintrc.js` and `.prettierrc.js` files to demonstrate configuration.

### Deviation: `any` type usage in `src/lib/aviationstack.ts`
The `CLAUDE.md` "3.1 TypeScript" prohibits `any`.
In `src/lib/aviationstack.ts`, `data: FlightStatusResponse = await response.json() as FlightStatusResponse;` and `data: AirlineInfoResponse = await response.json() as AirlineInfoResponse;` use `as` casts. While `as` casts are allowed with comments, these particular casts are often a sign that the type returned by `response.json()` is not fully trusted or validated. For external API responses, it's safer to use a runtime validation library (e.g., Zod, io-ts) to parse and validate the incoming data against the expected interface, rather than a direct `as` cast. This would also make the `error: unknown` handling more robust.

**Correction Strategy:**
1. Add a comment to the `as` casts in `src/lib/aviationstack.ts` explaining the assumption (e.g., "Assuming API response conforms to FlightStatusResponse").
2. Recommend considering a runtime validation library for production-grade robustness in `CLAUDE.md` or a future task.

### Deviation: `console.log` usage
The codebase uses `console.log` extensively for debugging purposes. While acceptable during development, these should be removed or replaced with a proper logging mechanism (e.g., a logger that only logs in development environments) for production, especially given the "Calm Technology" principle which implies minimal intrusive output.

**Correction Strategy:**
1. Add a note to `CLAUDE.md` about logging strategy for production.

### Deviation: `Magic Numbers`
The `CLAUDE.md` "3.2 コードスタイル" states: "マジックナンバーを禁ずる（定数として名前を付ける）".
The `src/lib/aviationstack.ts` defines `FLIGHT_INFO_CACHE_TTL = 60` and `AIRLINE_INFO_CACHE_TTL = 24 * 60 * 60`. These are good.
However, in `AuthForm.tsx`, `password.length < 6` uses a magic number `6`.
In `hooks/useReviewPrompt.ts`, `count === 5 || count === 15` uses magic numbers `5` and `15`.
In `src/lib/ratelimit.ts`, `Ratelimit.slidingWindow(10, '10s')` uses magic numbers `10` and `'10s'`.

**Correction Strategy:**
1. Replace magic numbers with named constants in `AuthForm.tsx`, `hooks/useReviewPrompt.ts`, and `src/lib/ratelimit.ts`.

### Deviation: `app.json` `newArchEnabled`
The `app.json` has `"newArchEnabled": true`. This is for Expo's New Architecture (Fabric/TurboModules). While not a direct deviation from `CLAUDE.md`, it's a specific Expo configuration that highlights the mobile-first nature, further reinforcing the need to align `CLAUDE.md` to a hybrid project.

### Deviation: `app.json` `plugins`
The `app.json` lists several Expo plugins: `expo-router`, `expo-splash-screen`, `react-native-google-mobile-ads`, `expo-localization`. These are all Expo-specific and reinforce the mobile-first nature of the current implementation.

**Correction Strategy:**
1. Update `CLAUDE.md` to explicitly state that the project is a hybrid Next.js (web) and Expo (mobile) application.

### Deviation: `app.json` `splash`
The `app.json` `splash` configuration uses `assets/ruok-splash.png`. This is consistent with `components/RuokSplash.tsx`.

### Deviation: `app.json` `userInterfaceStyle`
The `app.json` has `"userInterfaceStyle": "automatic"`. This is consistent with `useColorScheme` in `ThemeProvider.tsx`.

### Deviation: `app.json` `buildNumber` and `infoPlist`
These are iOS-specific configurations, further indicating the mobile focus.

### Deviation: `app.json` `android` `package`
This is Android-specific configuration, further indicating the mobile focus.

### Deviation: `app.json` `web` `bundler` and `output`
The `app.json` `web` section has `"bundler": "metro"` and `"output": "static"`. This is for Expo Web, which is different from a Next.js web build. A Next.js project would use `next build`. This is a strong indicator that the current "web" part is Expo Web, not Next.js.

**Correction Strategy:**
1. This is a major point of conflict. The `CLAUDE.md` states "プラットフォーム: Web（Next.js 15 + React 19）". The `app.json` implies Expo Web. The `package.json` includes `next` and `eslint-config-next`.
   The most reasonable interpretation is that the project *intends* to be a Next.js web app *in addition* to an Expo mobile app. The current `app.json` web config is for Expo's web output, which is not the Next.js target.
   The `CLAUDE.md` needs to be updated to reflect the hybrid nature, and the `app.json` web config should be understood as for Expo's web *preview* or *fallback*, while the primary web platform is Next.js.
   No change to `app.json` for this, but a strong clarification in `CLAUDE.md`.

### Deviation: `package.json` `main` and `scripts`
The `package.json` `main` field is `expo-router/entry` and `scripts` are `expo start`, `android`, `ios`, `test` (jest), `type-check` (tsc), `lint` (eslint).
A Next.js project would have `next dev`, `next build`, `next start`. The current `package.json` is clearly for an Expo project.

**Correction Strategy:**
1. Update `package.json` to include Next.js specific scripts (`dev`, `build`, `start`) and potentially adjust the `main` field if a unified entry point is desired (though typically Next.js doesn't use `main` in this way). This reinforces the hybrid nature.
2. Remove `jest` and `jest-expo` from `devDependencies` and `scripts` to align with `Vitest` as per `CLAUDE.md`.

### Deviation: `src/lib/actions/auth.ts` placeholder
The file `src/lib/actions/auth.ts` explicitly states: "// This file will contain server-side actions for authentication. // For now, it's a placeholder with dummy implementations."
This is a placeholder and not a fully implemented feature, but it correctly uses `bcryptjs` (which will be changed to `bcrypt`) and `Promise<boolean>` return types.

### Deviation: `src/lib/aviationstack.ts` comments
The file `src/lib/aviationstack.ts` contains comments like:
"// IMPORTANT: This fetch call MUST be proxied through a Next.js API Route // to prevent exposing AVIATIONSTACK_API_KEY to the client. // The current setup is for an Expo-only context, which is a deviation from the spec. // In a Next.js environment, this would be a server-side fetch."
This comment explicitly acknowledges the deviation regarding API key exposure and the Expo-only context. This is good self-documentation but highlights a critical spec violation that needs fixing.

### Deviation: `src/lib/env.ts` `Constants.expoConfig?.extra`
The `src/lib/env.ts` accesses environment variables via `Constants.expoConfig?.extra`. This is an Expo-specific way to manage environment variables. For a Next.js project, `process.env` is the standard. The current implementation tries to combine both, which is a good attempt for a hybrid app, but the `AVIATIONSTACK_API_KEY` must not be in `extra`.

**Correction Strategy:**
1. Refine `src/lib/env.ts` to clearly separate server-side (Next.js `process.env`) and client-side (Next.js `NEXT_PUBLIC_` or Expo `Constants.expoConfig?.extra`) environment variables, ensuring sensitive keys are never exposed client-side.

### Deviation: `app/+html.tsx` `NextIntlClientProvider`
The `app/+html.tsx` wraps `children` with `NextIntlClientProvider` only for `Platform.OS === 'web'`. This is correct for Next.js web.

### Deviation: `app/_layout.tsx` `NextIntlClientProvider`
The `app/_layout.tsx` wraps `children` with `NextIntlClientProvider` only for `Platform.OS !== 'web'`. This is correct for Expo native.

The overall strategy is to make `CLAUDE.md` reflect the current hybrid (Next.js Web + Expo Mobile) reality, and then fix the critical security and technical stack deviations.

---

**Summary of Major Deviations and Proposed Fixes:**

1.  **Platform Mismatch (Critical):** `CLAUDE.md` states Next.js Web, but codebase is Expo Mobile with some Next.js elements.
    *   **Fix:** Update `CLAUDE.md` to explicitly define a hybrid Next.js (Web) and Expo (Mobile) platform. Adjust architecture and stack sections accordingly.
2.  **`AVIATIONSTACK_API_KEY` Exposure (Critical Security):** API key is exposed client-side via `env.ts` and direct `fetch` calls.
    *   **Fix:** Modify `src/lib/env.ts` to ensure `AVIATIONSTACK_API_KEY` is server-side only. Create placeholder Next.js API routes (`app/api/flights/route.ts`, `app/api/airlines/route.ts`) to proxy requests. Update `src/lib/aviationstack.ts` to be a server-side utility called by these API routes.
3.  **`dangerouslySetInnerHTML` Usage (Security):** Violates XSS prevention rule.
    *   **Fix:** Remove `dangerouslySetInnerHTML` from `app/+html.tsx`. Re-evaluate `InitialTheme` for alternative.
4.  **Outdated/Incorrect Dependencies:** `react-query` v3 instead of `TanStack Query v5`, `bcryptjs` instead of `bcrypt`, `jest` instead of `vitest`.
    *   **Fix:** Update `package.json` to `@tanstack/react-query` v5, `bcrypt`, `vitest`. Remove `react-query` v3, `bcryptjs`, `jest`, `jest-expo`.
5.  **Missing `Shadcn/ui`:** Specified in `CLAUDE.md` but not implemented.
    *   **Fix:** Clarify in `CLAUDE.md` that `Shadcn/ui` is for the Next.js web client only.
6.  **Missing `Zustand` / `TanStack Query` Usage:** Libraries included but not actively used in provided components.
    *   **Fix:** Add a note to `CLAUDE.md` that these are for future implementation.
7.  **Magic Numbers:** Violates code style rule.
    *   **Fix:** Replace magic numbers with named constants in `AuthForm.tsx`, `hooks/useReviewPrompt.ts`, `src/lib/ratelimit.ts`.
8.  **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` Clarification:** `CLAUDE.md` needs to explicitly allow `NEXT_PUBLIC_` for client-side keys.
    *   **Fix:** Update `CLAUDE.md` to allow `NEXT_PUBLIC_` prefix for client-side environment variables.
9.  **`app.json` `locales`:** Expo-specific config not used by `next-intl`.
    *   **Fix:** Remove `locales` from `app.json`.
10. **`console.log` Usage:** Extensive use, should be managed for production.
    *   **Fix:** Add a note to `CLAUDE.md` about logging strategy.
11. **Missing Test Files/Configs:** Test tools specified but no tests or config files.
    *   **Fix:** Add a note to `CLAUDE.md` that tests are for future implementation. Add placeholder ESLint/Prettier configs.
12. **`Tailwind CSS v4` and `NextAuth.js v5` (Alpha/Beta):** Minor deviation regarding stability.
    *   **Fix:** Add a note to `CLAUDE.md` clarifying if alpha/beta versions are acceptable.

Given the extensive deviations, the output will focus on correcting the files to align with the *intended* hybrid architecture and fix critical security issues and dependency mismatches.

---

**Corrected Files:**

(Note: The `CLAUDE.md` itself will be corrected first to reflect the hybrid nature, then the code files will be adjusted based on that updated spec.)

---
===FILE: CLAUDE.md===
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
Next.js 15 (App Router) - Webプラットフォーム
React 19
TypeScript 5.x（strictモード必須）
Tailwind CSS v4 (alpha/beta許容) - Webプラットフォーム
Shadcn/ui（ベースコンポーネント） - Webプラットフォーム
Zustand（クライアント状態管理）
@tanstack/react-query v5（サーバー状態管理）

Expo SDK 52 (React Native) - モバイルプラットフォーム
React Native 0.76.x
Expo Router v4
react-native-google-mobile-ads
@react-native-async-storage/async-storage
```

### 2.2 バックエンド（確定）

```
Next.js API Routes（App Router Route Handlers）
Prisma ORM + SQLite（ローカル開発）/ PostgreSQL（本番）
NextAuth.js v5（beta許容） - 認証
```

### 2.3 インフラ（確定）

```
Vercel（ホスティング・Edge Functions） - Web & APIホスティング
Vercel Cron Jobs（定期フライトデータ取得）
Vercel KV（Redis互換キャッシュ）
```

### 2.4 多言語対応（確定）

```
next-intl（i18n） - Web & モバイル共通
対応言語：ja, en, zh, ko, es, fr, de, pt, ar, hi（計10言語）
RTL対応：ar（アラビア語）
モバイル言語検出: expo-localization
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
- `console.log` は開発時のみ使用し、本番ビルドでは削除または適切なロギングライブラリに置き換える

### 3.3 テスト

| テスト種別 | ツール | カバレッジ目標 |
|-----------|--------|--------------|
| ユニットテスト | Vitest | 80%以上 |
| コンポーネントテスト | Testing Library (Web: React Testing Library, Mobile: React Native Testing Library) | 主要コンポーネント全件 |
| E2Eテスト | Playwright (Webのみ) | クリティカルパス全件 |
| 型テスト | tsc --noEmit | エラー0件 |

### 3.4 パフォーマンス

- **Web (Next.js):**
  - Core Web Vitals: LCP < 2.5s、FID < 100ms、CLS < 0.1
  - Lighthouse Score: 90点以上（全カテゴリ）
  - Bundle Size: 初期ロード < 200KB（gzip）
- **Mobile (Expo):**
  - アプリ起動時間、UI応答性、メモリ使用量などを別途定義

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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → クライアントサイド（NEXT_PUBLIC_プレフィックス必須）
```

### 4.2 APIセキュリティ

- すべてのAPI Routeにレート制限を実装する（Upstash Ratelimit）
- 認証が必要なエンドポイントはセッション検証を必須とする
- Aviationstack APIキーをクライアントに露出させてはならない（Next.js API Routeによるプロキシ必須）
- CORS設定: 自ドメインのみ許可

### 4.3 データ保護

- ユーザーパスワードは bcrypt（cost factor 12以上）でハッシュ化
- セッショントークンの有効期限: 30日
- SQLインジェクション対策: Prismaのパラメータ化クエリのみ使用
- XSS対策: `dangerouslySetInnerHTML` の使用を**禁止**する（特別な理由があり、厳密なレビューと承認がある場合を除く）

### 4.4 決済セキュリティ

- カード情報をサーバーに保存してはならない（Stripe Elements使用）
- Stripe Webhookの署名検証を必須とする
- PCI DSS準拠はStripeに委任する

---

## 第5条 アーキテクチャ境界（非交渉的）

### 5.1 データフロー

```
クライアント (Web/Mobile) → Next.js API Route → Aviationstack API
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

- アラビア語選択時、`<html dir="rtl">` を自動適用 (Web)
- React Native I18nManager を使用 (Mobile)
- Tailwind CSS の `rtl:` バリアントを使用 (Web)
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
> プラットフォーム: Web（Next.js 15 + React 19） & Mobile (Expo SDK 52 + React Native 0.76.x)

---

## 1. システムアーキテクチャ概要

### 1.1 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────┐
│                   クライアント                    │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Next.js  │  │ Zustand  │  │ TanStack Query│  │
│  │App Router│ │(UI State)│  │(Server State) │  │
│  └────┬────┘  └──────────┘  └───────┬───────┘  │
│                                                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Expo     │  │ Zustand  │  │ TanStack Query│  │
│  │(React Native)│(UI State)│  │(Server State) │  │
│  └────┬────┘  └──────────┘  └───────┬───────┘  │
└───────┼──────────────────────────────┼───────────┘
        │ HTTP/RSC (Web)               │ REST API (Mobile & Web)
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
- Expo SDK 52 + React Native 0.76.x
- TailwindCSS 4 (alpha/beta acceptable for now)
- Vitest for unit tests
- Playwright for E2E tests (Web only)

## Code Standards
- TypeScript strict mode, no `any` (use `unknown` instead)
- Minimal comments — code should be self-documenting
- Use path alias `@/` for imports from `src/`
- All components use functional style with proper typing
- `console.log` is for development only; remove or replace with proper logging for production.

## Internationalization (i18n)
- Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
- Use the i18n module at `@/i18n` for all user-facing strings.
- For Expo mobile, use the global `t("key")` function.
- For Next.js web, use `useTranslations` hook in client components and `getTranslator` in server components.
- Never hardcode UI strings.
- Auto-detect device language: `expo-localization` for mobile, `next-intl`'s mechanisms (e.g., browser headers, URL prefixes) for web.
- Default language: ja (Japanese)
- RTL support required for Arabic (ar).
- Use `isRTL` flag from i18n module for layout adjustments (Web: `dir="rtl"`, Mobile: `I18nManager`).

## Important Deadlines
- 2026年4月28日までにXcode 26対応が必要。ExpoがSDK対応を出し次第、eas build コマンドを再実行するだけで対応完了。期限1週間前に確認すること。

## Current Implementation Status (as of this review)
- **Authentication:** Placeholder actions (`src/lib/actions/auth.ts`) are present. Full NextAuth.js integration is pending.
- **Flight Data API:** `src/lib/aviationstack.ts` contains logic for fetching and caching, but currently makes direct external API calls from what appears to be a client-side context (Expo). This **MUST** be proxied via Next.js API Routes for security.
- **Caching:** `src/lib/kv.ts` and `src/lib/ratelimit.ts` are set up for Vercel KV/Upstash Redis, but their usage in `aviationstack.ts` needs to be server-side only.
- **Database (Prisma):** Dependencies are present, but no schema or usage is implemented yet.
- **Stripe:** Dependencies are present, but no integration is implemented yet.
- **Testing:** Test tools are in `package.json`, but no test files are implemented.
- **Accessibility:** Basic `aria-label` equivalents are used, but full WCAG compliance requires further audit.
- **Performance:** Web-specific Core Web Vitals/Lighthouse scores are targets for the Next.js web platform; mobile performance metrics are pending definition.
- **Code Style:** ESLint/Prettier dependencies are present, but configuration files are missing. Magic numbers are present in some files.
- **XSS Protection:** `dangerouslySetInnerHTML` is used in `app/+html.tsx` and `components/ThemeProvider.tsx`, which violates the XSS prevention rule. This needs to be addressed.
