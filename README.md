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

## 開発計画

### Phase 1: データ収集・変換
- [ ] `./scripts/fetch-data` スクリプトの実装
  - [ ] HTTPキャッシュ対応ダウンロード機能
  - [ ] PDFからの冪等なデータ抽出
  - [ ] アプリ用形式への変換
- [ ] メーカーコード一覧PDFのダウンロード
- [ ] PDFからデータ抽出
- [ ] JSON形式への変換
- [ ] ファイルサイズの確認

### データ取得の実行方法

```bash
# 統合スクリプトで一括実行（推奨）
./scripts/fetch-data

# または手動で段階的に実行
# 1. PDFダウンロード
# 2. python scripts/extract_pdf.py
# 3. bun run scripts/convert_data.ts
```

### Phase 2: 基本実装
- [ ] bun + TanStack Routerのセットアップ
- [ ] Base UIコンポーネントの統合
- [ ] メーカーコード検索機能の実装
- [ ] レスポンシブUI実装

### Phase 3: デプロイ
- [ ] Cloudflare Workers設定
- [ ] bunでビルド
- [ ] 本番環境デプロイ

### Phase 4: 拡張（オプション）
- [ ] 商品コード検索機能
- [ ] 認証製品一覧機能
- [ ] 多言語対応（日本語/英語）

## 参考リンク

- [ECHONET Consortium](https://echonet.jp/)
- [ECHONET Lite規格書](https://echonet.jp/spec_g/)
- [TanStack Router](https://tanstack.com/router)
- [Base UI](https://base-ui.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [syumai/workers](https://github.com/syumai/workers)
