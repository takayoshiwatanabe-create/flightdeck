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

## Recently Implemented Feature: 認証機能の実装 (1)
### Description
ユーザーがメールアドレスとパスワードでログイン・サインアップできるフォームを実装する。
Google認証のプレースホルダーも含む。

### Components
- `app/(auth)/login.tsx`: ログイン画面
- `app/(auth)/signup.tsx`: サインアップ画面
- `components/AuthForm.tsx`: 認証フォームコンポーネント (ログイン・サインアップ共通)

### Styling
- **カラーシステム**:
  - `login.tsx`, `signup.tsx`:
    - 背景色: ダークモード `#121212`, ライトモード `#FFFFFF`
    - テキスト色: ダークモード `#F9FAFB`, ライトモード `#1F2937`
    - セカンダリテキスト色: ダークモード `#D1D5DB`, ライトモード `#6B7280`
    - リンク色: ダークモード `#22D3EE` (シアン), ライトモード `#007AFF` (iOS標準青)
  - `AuthForm.tsx`:
    - 入力フィールド背景色: ダークモード `#374151`, ライトモード `#F3F4F6`
    - 入力テキスト色: ダークモード `#F9FAFB`, ライトモード `#1F2937`
    - 入力プレースホルダー色: ダークモード `#9CA3AF`, ライトモード `#6B7280`
    - 入力ボーダー色: ダークモード `#4B5563`, ライトモード `#E5E7EB`
    - プライマリボタン背景色: `#22D3EE` (シアン)
    - プライマリボタンテキスト色: ダークモード `#1F2937`, ライトモード `#FFFFFF`
    - Googleボタン背景色: `#DB4437` (Google Red)
    - Googleボタンテキスト色: `#FFFFFF`
    - アイコン色: ダークモード `#D1D5DB`, ライトモード `#6B7280`
    - エラーテキスト色: `#EF4444` (赤)
    - セカンダリテキスト色: ダークモード `#D1D5DB`, ライトモード `#6B7280`
- **レイアウト**:
  - 中央揃え
  - パディング: 24
  - タイトル: `fontSize: 32`, `fontWeight: 'bold'`, `marginBottom: 32`
  - リンクコンテナ: `flexDirection: 'row'`, `marginTop: 20`
  - フォームの最大幅: 400px
  - 入力フィールド: `height: 50`, `borderRadius: 8`, `paddingHorizontal: 15`, `marginBottom: 15`
  - パスワード入力フィールド: `flexDirection: 'row'`, `alignItems: 'center'`, `height: 50`, `borderWidth: 1`, `borderRadius: 8`, `marginBottom: 20`
  - ボタン: `height: 50`, `borderRadius: 8`, `alignItems: 'center'`, `justifyContent: 'center'`, `marginBottom: 20`
  - ソーシャルログインボタン: `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, `height: 50`, `borderRadius: 8`, `width: '100%'`, `marginBottom: 10`

### Internationalization (i18n)
- 以下の翻訳キーを `i18n/translations.ts` に追加し、全10言語に対応させる。
  - `auth.login.title`
  - `auth.login.noAccount`
  - `auth.login.signUp`
  - `auth.login.button`
  - `auth.signup.title`
  - `auth.signup.hasAccount`
  - `auth.signup.login`
  - `auth.signup.button`
  - `auth.form.emailPlaceholder`
  - `auth.form.passwordPlaceholder`
  - `auth.form.error.emptyFields`
  - `auth.form.error.invalidEmail`
  - `auth.form.error.passwordTooShort`
  - `auth.form.or`
  - `auth.form.googleLogin`
  - `auth.form.showPassword` (追加)
  - `auth.form.hidePassword` (追加)

### Security
- 認証ロジックはNextAuth.js API Routeを使用する（TODOコメントで明記）。
- パスワードはクライアントサイドでハッシュ化せず、サーバーサイドで処理する。
- Google認証はプレースホルダーのみで、実際のAPI連携は後続フェーズで実装。

### Accessibility
- キーボード操作対応 (TextInput, Pressable)
- スクリーンリーダー対応 (`aria-label` などの追加検討)

### Deviations from Constitution
- `app.json` の `plugins` に `expo-localization` が含まれているが、これは `next-intl` を使用するという憲法第2条2.4項と矛盾する。`expo-localization` はモバイルアプリのデバイス言語検出に有用だが、i18nのフレームワークとしては `next-intl` が指定されているため、このプラグインは不要か、`next-intl` との連携方法を明確にする必要がある。現状では `expo-localization` が `i18n/index.ts` で直接使用されているため、`next-intl` の使用が未実装である。
- 憲法第2条2.1項でフロントエンドに `Next.js 15 (App Router)` が指定されているが、`package.json` と `app.json` は `expo` および `expo-router` を使用しており、これはモバイルアプリ開発のスタックである。Web (Next.js) とモバイル (Expo) の両方をターゲットにする場合、設計仕様書でその旨を明確にするか、どちらかに統一する必要がある。現状のファイル構成はExpoプロジェクトであり、Next.jsのApp Routerとは異なる。
- 憲法第3条3.1項で「すべての関数に戻り値の型注釈を付ける」とあるが、`getColors` 関数に型注釈が不足している箇所がある。
- 憲法第3条3.1項で `any` 型の使用を禁止しているが、`i18n/index.ts` と `components/ThemeProvider.tsx` の `catch (error: unknown)` で `error` を `unknown` にしているのは正しいが、`error` の型を `any` にしてしまうと憲法違反となる。現状は `unknown` で問題ない。
- 憲法第8条8.2項で「欠航: #6B7280（グレー） ← 赤禁止」とあるが、`AuthForm.tsx` のエラーテキスト色に `#EF4444` (赤) が使用されている。これは「過剰な赤色警告の使用を禁ずる」というUX原則に抵触する可能性がある。エラー表示自体は必要だが、その色を赤にするか、より穏やかな色にするか検討が必要。ただし、これは「遅延」ステータス色に関する記述であり、一般的なエラーメッセージの色については明示されていないため、厳密には違反ではないかもしれないが、UX原則の意図を汲むと避けるべき。

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
