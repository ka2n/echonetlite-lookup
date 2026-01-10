# ECHONET Lite Lookup プロジェクト情報

## プロジェクト概要

ECHONET Liteのメーカーコードと商品コードを検索できるウェブアプリケーション。

## 技術スタック

### 開発環境
- **グローバルツール管理**: aqua
- **パッケージマネージャー**: bun

### フロントエンド
- **フレームワーク**: TanStack Router (SPA)
- **UIコンポーネント**: Base UI
- **ビルドツール**: bun（Viteは不使用）
- **デプロイ**: Cloudflare Workers

### データ管理
- **優先**: 静的JSON（データベースレス）
- **代替**: SQLite embedded（データが大規模な場合）
- **最終手段**: Cloudflare D1

### 言語
- **フロントエンド**: TypeScript
- **バックエンド**: Go（必要な場合のみ）

## 開発方針

1. **データベースレス優先**: 可能な限りD1やKVを使わない
2. **シンプル設計**: 最小限の依存関係
3. **パフォーマンス重視**: バンドルサイズとレスポンス速度の最適化
4. **段階的実装**: Phase 1から順に実装

## ドキュメント構成

- `README.md`: プロジェクト概要と開発計画
- `external-docs/REFERENCES.md`: 参考資料とリソース
- `external-docs/ARCHITECTURE.md`: システムアーキテクチャ設計
- `external-docs/IMPLEMENTATION_GUIDE.md`: 実装手順
- `external-docs/API_SPEC.md`: API仕様（将来用）

## セットアップ手順

```bash
# 1. aquaのインストール
brew install aquaproj/aqua/aqua

# 2. プロジェクトツールのインストール
aqua install

# 3. 依存関係のインストール
bun install
```

## 次のステップ

1. `./scripts/fetch-data` スクリプトの実装
2. メーカーコードPDFのダウンロードとデータ抽出
3. フロントエンド実装（bun + TanStack Router）
4. Cloudflare Workersへのデプロイ

## データソース

- ECHONET Consortium: https://echonet.jp/
- メーカーコード一覧: https://echonet.jp/spec_g/
- 認証製品: https://echonet.jp/product/echonet-lite/list/-/-/

## 重要な制約

- Cloudflare Workers Free plan: 1MB制限（圧縮後）
- データサイズ次第でアーキテクチャを選択
- パフォーマンス最優先

## コミットルール

- conventional commits形式を推奨
- 例: `feat: add manufacturer search`, `docs: update README`
