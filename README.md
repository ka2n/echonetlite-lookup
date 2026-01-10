# ECHONET Lite Lookup

ECHONET Liteのメーカーコードや商品コードを検索できるウェブアプリケーション

## 概要

ECHONET Liteは日本のスマートホーム機器通信規格です。このアプリケーションは、ECHONET Liteで使用されるメーカーコード（3バイトの16進数）と商品コード、および認証製品情報を検索できるツールを提供します。

## 主な機能

- メーカーコード検索
  - 16進数コードから企業名を検索
  - 企業名からメーカーコードを検索
- 商品コード検索
- ECHONET Lite認証製品の閲覧
- レスポンシブデザイン対応

## 技術スタック

### 開発環境
- **グローバルツール管理**: aqua
- **パッケージマネージャー**: bun

### フロントエンド
- **フレームワーク**: TanStack Router (SPA)
- **UIコンポーネント**: Base UI
- **ビルドツール**: bun（Viteは不使用）
- **デプロイ先**: Cloudflare Workers

### データ管理戦略

データベースレスアーキテクチャを優先し、以下の優先順位で実装:

1. **第一選択: 静的データEmbed（推奨）**
   - メーカーコード一覧をJSON/TypeScriptファイルとしてバンドル
   - ファイルサイズが許容範囲内（~数百KB）であれば最適
   - デプロイが単純で、追加のインフラ不要

2. **第二選択: Workers + Embedded SQLite**
   - バックエンド: [syumai/workers](https://github.com/syumai/workers)
   - データベース: SQLite（デプロイ時にembed）
   - クエリ生成: sqlc
   - ファイルサイズが大きい場合の代替案

3. **第三選択: Cloudflare D1**
   - 上記2つが技術的に困難な場合の最終手段

### ファイルサイズ試算

- メーカーコード一覧: ~数百件 → JSON形式で50-100KB程度（推定）
- 認証製品リスト: 規模による（要調査）

## データソース

### ECHONET Consortium公式リソース

1. **メーカーコード一覧**
   - URL: https://echonet.jp/spec_g/
   - ファイル: list_code.pdf（発行済メーカーコード一覧）
   - 公開日: 2021年10月1日より一般公開

2. **認証製品データベース**
   - URL: https://echonet.jp/product/echonet-lite/list/-/-/

3. **規格書・仕様書**
   - URL: https://echonet.jp/spec_g/
   - ECHONET Lite規格の詳細情報

## プロジェクト構造

```
echonetlite-lookup/
├── scripts/
│   ├── fetch-data       # データ取得・変換スクリプト
│   └── lib/             # スクリプト用ライブラリ
├── .cache/              # HTTPキャッシュ（.gitignore）
├── data/
│   └── raw/             # 中間データ（正規化済み生データ）
├── src/
│   ├── routes/          # TanStack Routerのルート定義
│   ├── components/      # UIコンポーネント
│   ├── data/            # 最終データ（アプリで使用）
│   └── utils/           # ユーティリティ関数
├── external-docs/       # 参考資料・外部ドキュメント
├── public/              # 静的アセット
└── wrangler.toml        # Cloudflare Workers設定
```

## セットアップ

### 前提条件

1. **aquaのインストール**: グローバルツールの管理に使用

```bash
# aquaインストール（未インストールの場合）
brew install aquaproj/aqua/aqua
# または
curl -sSfL https://raw.githubusercontent.com/aquaproj/aqua-installer/v2.1.1/aqua-installer | bash
```

2. **必要なツールのインストール**:

```bash
# aqua.yamlからツールをインストール
aqua install
```

### 開発環境のセットアップ

```bash
# 依存関係のインストール（bun使用）
bun install
```

## 使用方法

### ローカル開発

```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun run dev
```

ブラウザで `http://localhost:3000` を開く

### テスト

```bash
# 全テストの実行
bun test

# 特定のテストファイルのみ
bun test src/lib/search.test.ts

# watchモード
bun test --watch
```

33個のテストが用意されています:
- キャッシュ管理テスト (5)
- ダウンロード機能テスト (8)
- データ変換テスト (11)
- 検索機能テスト (9)

### データ取得

```bash
# メーカーコードデータの取得と変換
./scripts/fetch-data

# または
bun run fetch-data
```

詳細は [scripts/README.md](scripts/README.md) を参照してください。

**注意**: 初回実行時は Python と pdfplumber が必要です:

```bash
pip install pdfplumber
```

### ビルド

```bash
# プロダクションビルド
bun run build
```

ビルド成果物は `dist/` ディレクトリに生成されます。

### デプロイ

Cloudflare Workersへのデプロイ:

```bash
# Wranglerでログイン（初回のみ）
wrangler login

# デプロイ
wrangler deploy
```

## プロジェクト構造（詳細）

```
echonetlite-lookup/
├── scripts/
│   ├── fetch-data           # データ取得メインスクリプト
│   ├── fetch-data.ts        # TypeScript実装
│   ├── lib/                 # ライブラリモジュール
│   │   ├── cache.ts         # HTTPキャッシュ管理
│   │   ├── download.ts      # ダウンロード処理
│   │   ├── transform.ts     # データ変換・正規化
│   │   └── tests/           # ユニットテスト
│   └── python/
│       └── extract_pdf.py   # PDF抽出スクリプト
├── src/
│   ├── routes/              # TanStack Routerルート
│   │   ├── __root.tsx       # ルートレイアウト
│   │   ├── index.tsx        # トップページ
│   │   ├── search.tsx       # 検索ページ
│   │   └── about.tsx        # Aboutページ
│   ├── components/          # Reactコンポーネント
│   │   ├── SearchBar.tsx    # 検索バー
│   │   └── ManufacturerList.tsx  # 結果一覧
│   ├── lib/                 # ユーティリティ
│   │   ├── search.ts        # 検索ロジック
│   │   └── search.test.ts   # 検索テスト
│   ├── data/                # 静的データ
│   │   └── manufacturers.json  # メーカーコード一覧
│   ├── styles/
│   │   └── global.css       # グローバルスタイル
│   ├── router.tsx           # ルーター設定
│   └── main.tsx             # エントリーポイント
├── data/
│   └── raw/                 # 中間データ（Git管理）
│       └── manufacturers.json
├── .cache/                  # HTTPキャッシュ（.gitignore）
├── index.html               # HTMLテンプレート
├── wrangler.toml            # Cloudflare Workers設定
└── package.json             # 依存関係とスクリプト
```

## 実装状況

### ✅ 完了

- [x] **Phase 1: データ収集・変換**
  - [x] HTTPキャッシュ対応ダウンロード機能
  - [x] PDFからの冪等なデータ抽出
  - [x] アプリ用形式への変換
  - [x] 統合スクリプト `./scripts/fetch-data`

- [x] **Phase 2: 基本実装**
  - [x] bun + TanStack Routerのセットアップ
  - [x] メーカーコード検索機能の実装
  - [x] レスポンシブUI実装

- [x] **Phase 3: デプロイ**
  - [x] Cloudflare Workers設定
  - [x] bunでビルド設定

- [x] **テスト**
  - [x] 全33テストの実装と合格

### 🚧 未実装（オプション）

- [ ] **Phase 4: 拡張機能**
  - [ ] 商品コード検索機能
  - [ ] ECHONET Lite認証製品一覧機能
  - [ ] 多言語対応（日本語/英語）
  - [ ] PWA化
  - [ ] データ自動更新（GitHub Actions）

## 技術的特徴

### TDD（テスト駆動開発）

すべての主要機能がテストファーストで実装されています:

1. テストを先に書く
2. テストが失敗することを確認
3. 最小限の実装でテストを通す
4. リファクタリング

### HTTPキャッシュ戦略

効率的なデータ取得のため、以下のHTTPキャッシュ機能を実装:

- `If-Modified-Since` ヘッダーによる条件付きリクエスト
- `ETag` サポート
- `304 Not Modified` レスポンスのハンドリング
- SHA-256ハッシュによるファイル整合性確認

### 冪等なデータ生成

同じ入力から常に同じ出力を生成:

- コードの正規化（大文字、ゼロパディング）
- ソート順の固定（コード昇順）
- タイムスタンプの分離管理

これにより、Git差分が意味のある変更のみを示します。

## トラブルシューティング

### bunが見つからない

```bash
# aquaでインストール
aqua install

# または直接インストール
curl -fsSL https://bun.sh/install | bash
```

### pdfplumberのインストールエラー

```bash
# システムパッケージが必要な場合
# macOS:
brew install poppler

# Ubuntu/Debian:
sudo apt-get install poppler-utils

# その後
pip install pdfplumber
```

### ビルドエラー

```bash
# node_modulesをクリーンアップ
rm -rf node_modules bun.lock
bun install

# キャッシュをクリア
rm -rf .cache dist
```

## 参考リンク

- [ECHONET Consortium](https://echonet.jp/)
- [ECHONET Lite規格書](https://echonet.jp/spec_g/)
- [TanStack Router](https://tanstack.com/router)
- [Base UI](https://base-ui.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [syumai/workers](https://github.com/syumai/workers)
