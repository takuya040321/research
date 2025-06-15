# スクレイピング対応Webアプリケーション要件定義書（更新版）

## 1. プロジェクト概要

### 1.1 目的
公式オンラインショップの商品情報を自動取得し、価格比較や商品管理を効率化するWebアプリケーションの開発

### 1.2 システム概要
- 複数の公式オンラインショップから商品情報をスクレイピング
- 静的サイト・動的サイト両方に対応した柔軟なスクレイピング機能
- 取得データをデータベースに保存・管理
- ユーザーフレンドリーなインターフェースでの商品一覧表示
- 自動データクリーンアップ機能

### 1.3 想定規模
- **対象ショップ数**: 3-10ショップ程度
- **商品数**: 1ショップあたり50-200商品
- **利用者**: 個人利用（単一ユーザー）

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
- **静的サイト対応**: Axios + Cheerio（HTMLパース）
- **動的サイト対応**: Puppeteer（必要に応じてPlaywright）
- **自動判定**: サイトタイプの自動判定機能

## 3. 機能要件

### 3.1 スクレイピング機能

#### 3.1.1 対象データ
- 商品名（必須）
- 商品画像URL（必須）
- 価格（必須）
- 値引価格（任意）

#### 3.1.2 スクレイピング設計

##### 動的・静的サイト対応
```typescript
interface ScraperConfig {
  shopName: string;
  targetUrl: string;
  type: 'static' | 'dynamic' | 'auto'; // サイトタイプ
  selectors: {
    productContainer: string;
    productName: string;
    productImage: string;
    price: string;
    discountedPrice?: string;
  };
  options?: {
    waitTime?: number; // 動的サイト用の待機時間
    userAgent?: string;
    headers?: Record<string, string>;
  };
}
```

##### 段階的エラーハンドリング
1. **第1段階**: 静的解析（Axios + Cheerio）
2. **第2段階**: 動的解析（Puppeteer）への自動切り替え
3. **第3段階**: 前回データの保持
4. **第4段階**: 3回連続失敗でアラート通知

#### 3.1.3 データ更新ロジック
- **重複チェック**: 公式オンラインショップ名 + 商品名での重複判定
- **更新処理**: 既存商品の価格情報更新
- **新規追加**: 未登録商品の新規保存
- **削除検知**: 前回存在した商品の削除を検知・マーク

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
  last_found_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  image_accessible BOOLEAN DEFAULT TRUE,
  image_last_checked TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (shop_name, product_name)
);
```

#### 3.2.2 価格履歴テーブル（price_history）
```sql
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  discounted_price INTEGER,
  recorded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (shop_name, product_name) REFERENCES products(shop_name, product_name)
);
```

#### 3.2.3 スクレイピングログテーブル（scraping_logs）
```sql
CREATE TABLE scraping_logs (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'partial', 'error', 'timeout'
  scraper_type VARCHAR(20), -- 'static', 'dynamic'
  products_found INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_added INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_seconds INTEGER,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2.4 データクリーンアップ関数
```sql
CREATE OR REPLACE FUNCTION cleanup_old_products()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE products 
  SET is_deleted = TRUE, deleted_at = NOW()
  WHERE last_found_at < NOW() - INTERVAL '3 months'
    AND is_deleted = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

#### 3.2.5 インデックス設計
- 主キー: (shop_name, product_name) の複合キー
- 検索用インデックス: shop_name, created_at, last_found_at
- 削除管理用インデックス: is_deleted, last_found_at

### 3.3 画面表示機能

#### 3.3.1 レイアウト構成
- **サイドメニュー**: 左側にナビゲーションメニューを配置
- **メインコンテンツ**: 右側に商品一覧表示エリア

#### 3.3.2 サイドメニュー構成
- **Home**: 全ショップの商品を統合表示
- **公式（オフィシャル）**: ツリー構造で以下を表示
  - 各オンラインショップ名（クリック可能）
  - クリック時に対象ショップの商品のみフィルタリング表示
- **管理機能**: データメンテナンス機能へのリンク

#### 3.3.3 商品一覧画面
- **表示形式**: テーブル形式
- **表示項目**:
  - 商品画像（サムネイル、アクセス不可時はフォールバック画像）
  - 商品名
  - 現在価格（値引価格 > 通常価格の優先表示）
  - 最終更新日時
  - ステータス（新規、更新、削除予定）
- **並び順**: 更新日時降順（デフォルト）

#### 3.3.4 スクレイピング実行機能
- **実行ボタン**: 各ショップページにスクレイピング実行ボタンを配置
- **実行状況表示**: スクレイピング進行状況の表示（静的/動的の使い分け表示）
- **結果通知**: 成功/失敗の結果表示
- **実行ログ**: 過去の実行履歴表示

#### 3.3.5 フィルタリング・検索機能
- ショップ名での絞り込み（サイドメニューから）
- 商品名での部分一致検索
- 価格帯での絞り込み
- ステータス別表示（アクティブ/削除予定）

#### 3.3.6 メンテナンス機能
- **データクリーンアップ**: 手動での古いデータ削除
- **画像URL検証**: 一括での画像アクセシビリティチェック
- **実行統計**: スクレイピング成功率等の表示

### 3.4 セキュリティ機能

#### 3.4.1 API保護
```typescript
// Bearer Token認証
const API_SECRET = process.env.API_SECRET;

if (req.headers.authorization !== `Bearer ${API_SECRET}`) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

#### 3.4.2 アクセス制御
- 管理機能へのアクセス制限
- APIエンドポイントの認証
- Rate Limiting（過度なスクレイピング防止）

## 4. 非機能要件

### 4.1 パフォーマンス要件
- **スクレイピング実行時間**: 1ショップあたり最大5分
- **画面表示速度**: 初期表示3秒以内
- **同時スクレイピング**: 最大3ショップまで並行実行
- **画像読み込み**: 遅延読み込み（Lazy Loading）対応

### 4.2 可用性要件
- **稼働率**: 99%以上
- **データ更新頻度**: 手動実行（ボタンクリック）+ 自動定期実行
- **エラー時の復旧**: 自動リトライ機能（最大3回）
- **フォールバック**: 静的→動的スクレイピングの自動切り替え

### 4.3 セキュリティ要件
- **APIアクセス制限**: Bearer Token認証
- **スクレイピング対策**: User-Agent偽装、リクエスト間隔制御
- **データ暗号化**: Supabase接続時のSSL/TLS通信
- **個人情報保護**: ユーザー認証不要設計

### 4.4 データ保持・管理要件
- **データ保持期間**: 公式サイトから削除後3ヶ月で自動削除
- **バックアップ**: Supabaseの自動バックアップ機能を利用
- **ログ保持**: スクレイピングログは6ヶ月保持

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
│   ├── ScrapingStatus.tsx     # スクレイピング状況表示
│   ├── MaintenancePanel.tsx   # メンテナンス機能パネル
│   └── ImageWithFallback.tsx  # フォールバック対応画像コンポーネント
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── auth.ts               # API認証ユーティリティ
│   └── scrapers/             # スクレイピングコンポーネント
│       ├── core/
│       │   ├── ScraperInterface.ts
│       │   ├── StaticScraper.ts    # Axios + Cheerio
│       │   ├── DynamicScraper.ts   # Puppeteer
│       │   └── ScraperFactory.ts   # スクレイパー選択ロジック
│       └── official/         # 公式ショップスクレイパー
│           ├── ShopAScraper.ts
│           ├── ShopBScraper.ts
│           └── ShopCScraper.ts
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── verify.ts     # 認証チェックAPI
│   │   ├── scraping/
│   │   │   ├── [shop].ts     # ショップ別スクレイピングAPI
│   │   │   └── batch.ts      # 一括スクレイピングAPI
│   │   ├── products/
│   │   │   ├── index.ts      # 全商品一覧API
│   │   │   └── [shop].ts     # ショップ別商品一覧API
│   │   ├── maintenance/
│   │   │   ├── cleanup.ts    # データクリーンアップAPI
│   │   │   ├── validate-images.ts # 画像URL検証API
│   │   │   └── stats.ts      # 統計情報API
│   │   └── logs/
│   │       └── scraping.ts   # スクレイピングログAPI
│   ├── shop/
│   │   └── [shopName].tsx    # ショップ別商品表示ページ
│   ├── maintenance/
│   │   └── index.tsx         # メンテナンス画面
│   └── index.tsx             # メインページ（Home）
├── types/
│   ├── Product.ts            # 商品型定義
│   ├── ScrapingLog.ts        # ログ型定義
│   └── ScraperConfig.ts      # スクレイパー設定型定義
└── utils/
    ├── imageValidator.ts     # 画像URL検証ユーティリティ
    ├── dataCleanup.ts        # データクリーンアップユーティリティ
    └── constants.ts          # 定数定義
```

### 5.2 スクレイピングコンポーネント設計

#### 5.2.1 共通インターフェース
```typescript
interface ScraperInterface {
  shopName: string;
  config: ScraperConfig;
  scrapeProducts(): Promise<ScrapingResult>;
}

interface ScrapingResult {
  success: boolean;
  products: Product[];
  scraperType: 'static' | 'dynamic';
  executionTime: number;
  errors: ScrapingError[];
}

interface ScrapingError {
  type: 'NETWORK_ERROR' | 'PARSE_ERROR' | 'RATE_LIMIT' | 'BLOCKED' | 'TIMEOUT';
  message: string;
  retryable: boolean;
}
```

#### 5.2.2 スクレイパーファクトリー
```typescript
class ScraperFactory {
  static create(config: ScraperConfig): ScraperInterface {
    switch (config.type) {
      case 'static':
        return new StaticScraper(config);
      case 'dynamic':
        return new DynamicScraper(config);
      case 'auto':
        // 自動判定ロジック
        return this.createWithAutoDetection(config);
    }
  }
}
```

## 6. 開発・運用要件

### 6.1 開発環境
- **Node.js**: v18以上
- **パッケージマネージャー**: npm または yarn
- **開発ツール**: ESLint, Prettier
- **追加依存関係**: Puppeteer, Playwright（必要に応じて）

### 6.2 デプロイメント
- **ホスティング**: Vercel（推奨）
- **環境変数管理**: Vercel Environment Variables
- **CI/CD**: GitHub Actions（任意）

### 6.3 環境変数
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# セキュリティ
API_SECRET=your_api_secret_key

# スクレイピング設定
MAX_CONCURRENT_SCRAPING=3
DEFAULT_SCRAPING_TIMEOUT=300000

# 画像検証
IMAGE_VALIDATION_TIMEOUT=5000
```

### 6.4 監視・ログ
- **スクレイピング実行ログ**: 成功/失敗の記録、実行時間、エラー詳細
- **エラー監視**: Vercel Analytics または Sentry
- **データベース監視**: Supabase Dashboard
- **パフォーマンス監視**: Core Web Vitals

## 7. 制約事項・考慮事項

### 7.1 法的制約
- **利用規約遵守**: 各ショップの利用規約確認必須
- **スクレイピング頻度**: 過度なアクセスを避ける（最低1秒間隔）
- **robots.txt**: 対象サイトのrobot.txt確認

### 7.2 技術的制約
- **Vercel制約**: Puppeteerの動作制限（Serverless Functions）
- **JavaScript依存サイト**: 動的コンテンツは追加のリソースが必要
- **CORS制約**: サーバーサイドでのスクレイピング実行必須
- **実行時間制限**: Vercelの最大実行時間（10秒〜300秒）

### 7.3 運用制約
- **メンテナンス**: ショップサイト変更時のスクレイパー修正
- **画像リンク切れ**: 外部画像URLの定期的な検証が必要
- **データ容量**: Supabaseの無料枠制限

## 8. 今後の拡張可能性

### 8.1 機能拡張
- 価格変動履歴のグラフ表示
- 在庫状況の取得
- プッシュ通知機能（価格下落時）
- 商品詳細情報の取得
- お気に入り商品機能
- 価格アラート機能

### 8.2 技術拡張
- GraphQL APIの導入
- キャッシュ機能の強化（Redis等）
- マイクロサービス化の検討
- AI/MLを活用した価格予測機能

## 9. プロジェクト開始準備

### 9.1 事前準備
1. Supabaseプロジェクトの作成
2. 対象ショップサイトの調査・分析
3. 各ショップの利用規約確認
4. 開発環境のセットアップ
5. API認証キーの生成

## 10. 実装フェーズ（更新版）

### Phase 1: 基本画面の作成 (3-5日)
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
  - 管理機能メニュー

#### 10.1.3 ページ作成
- **メインページ** (`pages/index.tsx`)
- **ショップ別ページ** (`pages/shop/[shopName].tsx`)
- **メンテナンスページ** (`pages/maintenance/index.tsx`)

#### 10.1.4 UIコンポーネント
- **商品テーブルコンポーネント** (`components/ProductTable.tsx`)
- **スクレイピングボタン** (`components/ScrapingButton.tsx`)
- **フォールバック対応画像** (`components/ImageWithFallback.tsx`)

**成果物**: 動作する基本UI（仮データ表示）

---

### Phase 2: スクレイピング処理の実装 (5-7日)
**目標**: 1つのショップからのデータ取得機能（静的サイト対応）

#### 10.2.1 スクレイピング基盤構築
- 型定義ファイル作成 (`types/Product.ts`, `types/ScraperConfig.ts`)
- 共通インターフェース定義 (`lib/scrapers/core/ScraperInterface.ts`)
- 静的スクレイパー実装 (`lib/scrapers/core/StaticScraper.ts`)

#### 10.2.2 ショップ別スクレイパー実装
- **1つのショップスクレイパー** (`lib/scrapers/official/ShopAScraper.ts`)
- エラーハンドリング実装
- ログ機能実装

#### 10.2.3 API エンドポイント作成
- **スクレイピングAPI** (`pages/api/scraping/[shop].ts`)
- **認証機能** (`lib/auth.ts`)
- **ログAPI** (`pages/api/logs/scraping.ts`)

**成果物**: 1ショップからデータ取得できる機能

---

### Phase 2.5: 動的サイト対応の検討 (3-4日)
**目標**: SPA等の動的サイトへの対応

#### 10.2.5.1 動的スクレイピング環境構築
- Puppeteerのセットアップ
- 動的スクレイパー実装 (`lib/scrapers/core/DynamicScraper.ts`)
- スクレイパーファクトリー実装 (`lib/scrapers/core/ScraperFactory.ts`)

#### 10.2.5.2 自動判定機能
- サイトタイプの自動判定ロジック
- 静的→動的の自動切り替え機能

**成果物**: 動的サイト対応のスクレイピング機能

---

### Phase 3: Supabaseの構築 (2-3日)
**目標**: データベース環境の構築

#### 10.3.1 データベース設計・作成
- テーブル作成（products, price_history, scraping_logs）
- インデックス設定
- データクリーンアップ関数作成

#### 10.3.2 Supabase クライアント設定
- **Supabase設定** (`lib/supabase.ts`)
- **データアクセス関数作成**

**成果物**: 稼働するSupabaseデータベース

---

### Phase 3.5: セキュリティ・メンテナンス機能 (2-3日)
**目標**: セキュリティ対策とメンテナンス機能の実装

#### 10.3.5.1 セキュリティ実装
- API認証機能
- Bearer Token認証
- Rate Limiting

#### 10.3.5.2 メンテナンス機能
- **データクリーンアップAPI** (`pages/api/maintenance/cleanup.ts`)
- **画像URL検証API** (`pages/api/maintenance/validate-images.ts`)
- **統計情報API** (`pages/api/maintenance/stats.ts`)

**成果物**: セキュアで保守性の高いシステム

---

### Phase 4: Supabaseデータの画面表示 (3-5日)
**目標**: データベースと画面の連携

#### 10.4.1 データ取得API作成
- **全商品取得API** (`pages/api/products/index.ts`)
- **ショップ別商品取得API** (`pages/api/products/[shop].ts`)

#### 10.4.2 フロントエンドデータ連携
- **商品テーブルコンポーネント更新**
- **サイドメニュー更新**
- **メンテナンス画面実装**

#### 10.4.3 スクレイピング→DB保存機能
- データ保存機能
- 重複データの更新処理
- 削除検知機能

**成果物**: 完全に動作するスクレイピング→保存→表示のフロー

---

### Phase 5: デプロイ (1-2日)
**目標**: 本番環境での稼働

#### 10.5.1 Vercel デプロイ準備
- 環境変数設定
- Puppeteerの動作確認

#### 10.5.2 本番環境設定・確認
- デプロイ実行
- 全機能の動作確認
- パフォーマンステスト

**成果物**: 本番稼働中のWebアプリケーション

---

### Phase 6: 自動スクレイピングの構築 (5-7日)
**目標**: 定期実行機能の実装

#### 10.6.1 自動実行機能実装
- **バッチ処理API** (`pages/api/scraping/batch.ts`)
- スケジューラー機能（Vercel Cron Jobs等）

#### 10.6.2 監視・アラート機能
- 実行ログの管理
- 失敗時の通知機能
- ダッシュボード機能

**成果物**: 完全自動化されたスクレイピングシステム

---

## 10.7 各フェーズの期間目安

| フェーズ | 期間目安 | 主要な作業 |
|---------|----------|------------|
| Phase 1 | 3-5日 | UI/UX構築、静的ページ作成 |
| Phase 2 | 5-7日 | 静的スクレイピング機能実装 |
| Phase 2.5 | 3-4日 | 動的スクレイピング対応 |
| Phase 3 | 2-3日 | データベース構築、接続設定 |
| Phase 3.5 | 2-3日 | セキュリティ・メンテナンス機能 |
| Phase 4 | 3-5日 | DB連携、動的データ表示 |
| Phase 5 | 1-2日 | デプロイ、本番環境設定 |
| Phase 6 | 5-7日 | 自動化、監視機能実装 |

**総期間**: 約4-5週間

## 10.8 各フェーズの成功基準

- **Phase 1**: 全画面が正常に表示され、ナビゲーションが動作する
- **Phase 2**: 1つのショップから商品データを正常に取得できる（静的サイト）
- **Phase 2.5**: 動的サイトからもデータを取得でき、自動切り替えが動作する
- **Phase 3**: Supabaseにデータを保存・取得できる
- **Phase 3.5**: セキュリティ機能とメンテナンス機能が正常に動作する
- **Phase 4**: スクレイピング→保存→表示の完全なフローが動作する
- **Phase 5**: 本番環境で全機能が正常に動作する
- **Phase 6**: 自動スクレイピングが安定して実行される

## 11. リスク管理

### 11.1 技術的リスク
- **Puppeteerの制約**: Vercel環境での動作制限
  - 対策: Playwrightへの切り替え検討
- **スクレイピング対象サイトの変更**: DOM構造の変更
  - 対策: 設定の外部化、アラート機能

### 11.2 運用リスク
- **利用規約違反**: 過度なアクセスによる制限
  - 対策: アクセス間隔の制御、監視機能
- **データ量の増加**: Supabaseの容量制限
  - 対策: 定期的なデータクリーンアップ

### 11.3 対応策
- 段階的な実装による早期問題発見
- 十分なテスト期間の確保
- バックアップ・復旧手順の整備