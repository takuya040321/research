# スクレイピング対応Webアプリケーション要件定義書

## 1. プロジェクト概要

### 1.1 目的
公式オンラインショップの商品情報を自動取得し、価格比較や商品管理を効率化するWebアプリケーションの開発

### 1.2 システム概要
- 複数の公式オンラインショップから商品情報をスクレイピング
- 取得データをデータベースに保存・管理
- ユーザーフレンドリーなインターフェースでの商品一覧表示

## 2. 技術要件

### 2.1 フロントエンド
- **フレームワーク**: Next.js (React)
- **UIライブラリ**: shadcn/ui
- **言語**: TypeScript

### 2.2 バックエンド
- **API**: Next.js API Routes
- **データベース**: Supabase（PostgreSQL）

### 2.3 スクレイピング
- **実行環境**: サーバーサイド（Next.js API Routes）
- **ライブラリ**: Axios + Cheerio（HTMLパース）

## 3. 機能要件

### 3.1 スクレイピング機能

#### 3.1.1 対象データ
- 商品名（必須）
- 商品画像URL（必須）
- 価格（必須）
- 値引価格（任意）

#### 3.1.2 スクレイピング設計
- **コンポーネント化**: 各公式オンラインショップ専用のスクレイピングコンポーネントを作成
- **設定管理**: スクレイピング対象URLはコンポーネント内で定義
- **エラーハンドリング**: スクレイピング失敗時の適切な処理

#### 3.1.3 データ更新ロジック
- **重複チェック**: 公式オンラインショップ名 + 商品名での重複判定
- **更新処理**: 既存商品の価格情報更新
- **新規追加**: 未登録商品の新規保存

### 3.2 データベース設計（Supabase）

#### 3.2.1 商品テーブル（products）
```sql
CREATE TABLE products (
  shop_name VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image_url TEXT NOT NULL,
  price INTEGER NOT NULL,
  discounted_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (shop_name, product_name)
);
```

#### 3.2.2 インデックス設計
- 主キー: (shop_name, product_name) の複合キー
- 検索用インデックス: shop_name, created_at

### 3.3 画面表示機能

#### 3.3.1 レイアウト構成
- **サイドメニュー**: 左側にナビゲーションメニューを配置
- **メインコンテンツ**: 右側に商品一覧表示エリア

#### 3.3.2 サイドメニュー構成
- **Home**: 全ショップの商品を統合表示（後で実装）
- **公式（オフィシャル）**: ツリー構造で以下を表示
  - 各オンラインショップ名（クリック可能）
  - クリック時に対象ショップの商品のみフィルタリング表示

#### 3.3.3 商品一覧画面
- **表示形式**: テーブル形式
- **表示項目**:
  - 商品画像（サムネイル）
  - 商品名
  - 現在価格（値引価格 > 通常価格の優先表示）
- **並び順**: 更新日時降順（デフォルト）

#### 3.3.4 スクレイピング実行機能
- **実行ボタン**: 各ショップページにスクレイピング実行ボタンを配置
- **実行状況表示**: スクレイピング進行状況の表示
- **結果通知**: 成功/失敗の結果表示

#### 3.3.5 フィルタリング・検索機能
- ショップ名での絞り込み（サイドメニューから）
- 商品名での部分一致検索
- 価格帯での絞り込み

## 4. 非機能要件

### 4.1 パフォーマンス要件
- **スクレイピング実行時間**: 1ショップあたり最大5分
- **画面表示速度**: 初期表示3秒以内
- **同時スクレイピング**: 最大3ショップまで並行実行

### 4.2 可用性要件
- **稼働率**: 99%以上
- **データ更新頻度**: 手動実行（ボタンクリック）
- **エラー時の復旧**: 自動リトライ機能（最大3回）

### 4.3 セキュリティ要件
- **APIアクセス制限**: レート制限の実装
- **スクレイピング対策**: User-Agent偽装、リクエスト間隔制御
- **データ暗号化**: Supabase接続時のSSL/TLS通信

## 5. システム構成

### 5.1 アプリケーション構成
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx        # サイドメニューコンポーネント
│   │   └── Layout.tsx         # 全体レイアウト
│   ├── ProductTable.tsx       # 商品一覧テーブル
│   ├── ScrapingButton.tsx     # スクレイピング実行ボタン
│   └── ScrapingStatus.tsx     # スクレイピング状況表示
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── scrapers/             # スクレイピングコンポーネント
│       ├── official/         # 公式ショップスクレイパー
│       │   ├── ShopAScraper.ts
│       │   ├── ShopBScraper.ts
│       │   └── ShopCScraper.ts
│       └── ScraperInterface.ts
├── pages/
│   ├── api/
│   │   ├── scraping/
│   │   │   └── [shop].ts     # ショップ別スクレイピングAPI
│   │   └── products/
│   │       ├── index.ts      # 全商品一覧API
│   │       └── [shop].ts     # ショップ別商品一覧API
│   ├── shop/
│   │   └── [shopName].tsx    # ショップ別商品表示ページ
│   └── index.tsx             # メインページ（Home）
└── types/
    └── Product.ts            # 型定義
```

### 5.2 スクレイピングコンポーネント設計

#### 5.2.1 共通インターフェース
```typescript
interface ScraperInterface {
  shopName: string;
  targetUrl: string;
  scrapeProducts(): Promise<Product[]>;
}
```

#### 5.2.2 ショップ別実装
- 各ショップのDOM構造に対応した個別実装
- 共通のエラーハンドリングとリトライ機能
- スクレイピング間隔の制御

## 6. 開発・運用要件

### 6.1 開発環境
- **Node.js**: v18以上
- **パッケージマネージャー**: npm または yarn
- **開発ツール**: ESLint, Prettier

### 6.2 デプロイメント
- **ホスティング**: Vercel（推奨）
- **環境変数管理**: Vercel Environment Variables
- **CI/CD**: GitHub Actions（任意）

### 6.3 監視・ログ
- **スクレイピング実行ログ**: 成功/失敗の記録
- **エラー監視**: Vercel Analytics または Sentry
- **データベース監視**: Supabase Dashboard

## 7. 制約事項・考慮事項

### 7.1 法的制約
- **利用規約遵守**: 各ショップの利用規約確認必須
- **スクレイピング頻度**: 過度なアクセスを避ける
- **robots.txt**: 対象サイトのrobot.txt確認

### 7.2 技術的制約
- **静的HTML対応**: Axios + Cheerioによる静的HTMLパース
- **JavaScript依存サイト**: 動的コンテンツは対応困難（設計時に考慮必要）
- **CORS制約**: サーバーサイドでのスクレイピング実行必須

### 7.3 運用制約
- **メンテナンス**: ショップサイト変更時のスクレイパー修正
- **データ容量**: 画像保存方法の検討（URL参照 vs ローカル保存）

## 8. 今後の拡張可能性

### 8.1 機能拡張
- 価格変動履歴の記録・グラフ表示
- 在庫状況の取得
- プッシュ通知機能（価格下落時）
- 商品詳細情報の取得

### 8.2 技術拡張
- GraphQL APIの導入
- キャッシュ機能の強化
- マイクロサービス化の検討

## 9. プロジェクト開始準備

### 9.1 事前準備
1. Supabaseプロジェクトの作成
2. 対象ショップサイトの調査・分析
3. 各ショップの利用規約確認
4. 開発環境のセットアップ

## 10. 実装フェーズ

### Phase 1: 画面の作成
**目標**: 基本的なUI/UXの構築

#### 10.1.1 環境構築
- Next.js + TypeScript プロジェクト作成
- shadcn/ui のセットアップ
- ESLint, Prettier の設定

#### 10.1.2 レイアウト構築
- **基本レイアウトコンポーネント作成**
  - `components/layout/Layout.tsx`
  - `components/layout/Sidebar.tsx`
- **サイドメニューの実装**
  - Home リンク
  - 公式（オフィシャル）ツリー構造
  - 仮のショップ名表示（静的データ）

#### 10.1.3 ページ作成
- **メインページ** (`pages/index.tsx`)
  - 基本レイアウトの適用
  - プレースホルダーコンテンツ
- **ショップ別ページ** (`pages/shop/[shopName].tsx`)
  - 動的ルーティングの実装
  - 仮の商品テーブル表示

#### 10.1.4 UIコンポーネント
- **商品テーブルコンポーネント** (`components/ProductTable.tsx`)
  - 商品画像、商品名、価格のカラム
  - 仮データでの表示確認
- **スクレイピングボタン** (`components/ScrapingButton.tsx`)
  - ボタンコンポーネント（機能は後で実装）
  - ローディング状態の表示

**成果物**: 動作する基本UI（仮データ表示）

---

### Phase 2: スクレイピング処理の実装（1サイト対応）
**目標**: 1つのショップからのデータ取得機能

#### 10.2.1 スクレイピング環境構築
- Axios, Cheerio のインストール
- 型定義ファイル作成 (`types/Product.ts`)

#### 10.2.2 スクレイパー実装
- **インターフェース定義** (`lib/scrapers/ScraperInterface.ts`)
```typescript
interface ScraperInterface {
  shopName: string;
  targetUrl: string;
  scrapeProducts(): Promise<Product[]>;
}
```

- **1つのショップスクレイパー** (`lib/scrapers/official/ShopAScraper.ts`)
  - 対象サイトのDOM解析
  - 商品名、画像URL、価格、値引価格の取得
  - エラーハンドリング実装

#### 10.2.3 API エンドポイント作成
- **スクレイピングAPI** (`pages/api/scraping/[shop].ts`)
  - ショップ名を受け取ってスクレイピング実行
  - JSON形式でデータ返却
  - エラー時の適切なレスポンス

#### 10.2.4 フロントエンド連携
- スクレイピングボタンからAPIコール
- 実行状況表示（ローディング、成功/失敗）
- 取得データの一時表示（コンソールまたは画面）

**成果物**: 1ショップからデータ取得できる機能

---

### Phase 3: Supabaseの構築
**目標**: データベース環境の構築

#### 10.3.1 Supabase プロジェクト作成
- Supabaseアカウント作成・プロジェクト作成
- データベースURL、APIキーの取得

#### 10.3.2 テーブル設計・作成
```sql
CREATE TABLE products (
  shop_name VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image_url TEXT NOT NULL,
  price INTEGER NOT NULL,
  discounted_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (shop_name, product_name)
);
```

#### 10.3.3 Supabase クライアント設定
- **Supabase設定** (`lib/supabase.ts`)
  - クライアント初期化
  - 環境変数設定
- **データアクセス関数作成**
  - 商品データ挿入/更新
  - 商品データ取得（全件・ショップ別）

#### 10.3.4 接続テスト
- テストデータの挿入・取得確認
- エラーハンドリングの確認

**成果物**: 稼働するSupabaseデータベース

---

### Phase 4: Supabaseデータの画面表示
**目標**: データベースと画面の連携

#### 10.4.1 データ取得API作成
- **全商品取得API** (`pages/api/products/index.ts`)
- **ショップ別商品取得API** (`pages/api/products/[shop].ts`)

#### 10.4.2 フロントエンドデータ連携
- **商品テーブルコンポーネント更新**
  - API呼び出し機能追加
  - リアルデータ表示
  - ローディング状態管理
- **サイドメニュー更新**
  - 実際のショップ名を動的取得・表示

#### 10.4.3 スクレイピング→DB保存機能
- Phase 2のスクレイピング結果をSupabaseに保存
- 重複データの更新処理実装
- 成功/失敗の適切な通知

#### 10.4.4 データ表示・更新確認
- スクレイピング実行後の画面自動更新
- 価格変更の確認
- 新規商品の追加確認

**成果物**: 完全に動作するスクレイピング→保存→表示のフロー

---

### Phase 5: デプロイ
**目標**: 本番環境での稼働

#### 10.5.1 Vercel デプロイ準備
- Vercelアカウント作成
- GitHub リポジトリ連携
- 環境変数設定（Supabase接続情報）

#### 10.5.2 本番環境設定
- **環境変数設定**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - その他必要な設定値

#### 10.5.3 デプロイ実行・確認
- Vercelへのデプロイ
- 本番環境での動作確認
- スクレイピング機能の動作テスト
- データベース接続確認

#### 10.5.4 監視設定
- Vercel Analytics設定
- エラー監視設定
- パフォーマンス監視

**成果物**: 本番稼働中のWebアプリケーション

---

### Phase 6: 自動スクレイピングの構築
**目標**: 定期実行機能の実装

#### 10.6.1 スケジューラー機能検討
- **オプション1**: Vercel Cron Jobs
- **オプション2**: GitHub Actions
- **オプション3**: 外部サービス（Upstash Qstash等）

#### 10.6.2 バッチ処理実装
- **自動実行API** (`pages/api/batch/scrape-all.ts`)
  - 全ショップの一括スクレイピング
  - 実行ログの記録
  - エラー時の通知機能

#### 10.6.3 スケジュール設定
- 実行頻度の決定（日次、週次等）
- 実行時間の最適化
- タイムアウト設定

#### 10.6.4 監視・アラート機能
- **実行ログテーブル作成**
```sql
CREATE TABLE scraping_logs (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(100),
  status VARCHAR(20), -- 'success', 'error', 'timeout'
  products_count INTEGER,
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

- 失敗時のSlack/メール通知
- ダッシュボードでの実行状況確認

**成果物**: 完全自動化されたスクレイピングシステム

---

## 10.7 各フェーズの期間目安

| フェーズ | 期間目安 | 主要な作業 |
|---------|----------|------------|
| Phase 1 | 3-5日 | UI/UX構築、静的ページ作成 |
| Phase 2 | 5-7日 | スクレイピング機能実装、1サイト対応 |
| Phase 3 | 2-3日 | データベース構築、接続設定 |
| Phase 4 | 3-5日 | DB連携、動的データ表示 |
| Phase 5 | 1-2日 | デプロイ、本番環境設定 |
| Phase 6 | 5-7日 | 自動化、監視機能実装 |

**総期間**: 約3-4週間

## 10.8 各フェーズの成功基準

- **Phase 1**: 全画面が正常に表示され、ナビゲーションが動作する
- **Phase 2**: 1つのショップから商品データを正常に取得できる
- **Phase 3**: Supabaseにデータを保存・取得できる
- **Phase 4**: スクレイピング→保存→表示の完全なフローが動作する
- **Phase 5**: 本番環境で全機能が正常に動作する
- **Phase 6**: 自動スクレイピングが安定して実行される