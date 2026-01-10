# 参考資料・技術リソース

## ECHONET Lite 公式リソース

### 1. メーカーコード一覧

**URL**: https://echonet.jp/spec_g/

メーカーコード一覧PDF（list_code.pdf）がダウンロード可能。

- **公開開始**: 2021年10月1日
- **フォーマット**: PDF
- **内容**: 16進数メーカーコード（3バイト）と企業名の対応表

**アクセス方法**:
1. ECHONET Consortium公式サイトにアクセス
2. 「規格書・仕様書」ページを開く
3. 「発行済メーカーコード一覧」をダウンロード

### 2. 認証製品データベース

**URL**: https://echonet.jp/product/echonet-lite/list/-/-/

ECHONET Lite認証製品のリストが閲覧可能。

**検索条件**:
- メーカー
- 製品カテゴリ
- 機器オブジェクト

### 3. ECHONET Lite規格書

**URL**: https://echonet.jp/spec_g/

ECHONET Lite通信規格の詳細仕様書がダウンロード可能。

**主要ドキュメント**:
- APPENDIX ECHONET機器オブジェクト詳細規定
- ECHONET Lite規格書 Ver.1.x

## 技術スタック参考資料

### 開発環境

#### aqua

**公式サイト**: https://aquaproj.github.io/

**概要**:
- グローバルツールのバージョン管理
- 宣言的な設定（aqua.yaml）
- チーム全体で環境を統一

**ドキュメント**:
- [Getting Started](https://aquaproj.github.io/docs/tutorial)
- [Configuration](https://aquaproj.github.io/docs/reference/config)

#### bun

**公式サイト**: https://bun.sh/

**概要**:
- JavaScriptランタイム・パッケージマネージャー
- ビルトインバンドラー・テストランナー
- 高速なパッケージインストール

**ドキュメント**:
- [Installation](https://bun.sh/docs/installation)
- [Bundler](https://bun.sh/docs/bundler)
- [Package Manager](https://bun.sh/docs/cli/install)

### Cloudflare Workers

**公式ドキュメント**: https://developers.cloudflare.com/workers/

**重要トピック**:
- Workers Runtime API
- Wrangler CLI
- Workers Sites（SPAデプロイ）
- サイズ制限:
  - Free plan: 1MB（圧縮後）
  - Paid plan: 10MB（圧縮後）

### TanStack Router

**公式サイト**: https://tanstack.com/router/latest

**特徴**:
- Type-safe routing
- Code splitting
- データローディング統合
- SPA向けの軽量ルーター

**参考ガイド**:
- [Quick Start](https://tanstack.com/router/latest/docs/framework/react/quick-start)
- [Route Trees](https://tanstack.com/router/latest/docs/framework/react/guide/route-trees)
- [Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)

### Base UI

**公式サイト**: https://base-ui.com/

**概要**:
- ヘッドレスUIコンポーネントライブラリ
- アクセシビリティ対応
- カスタマイズ性が高い

**コンポーネント例**:
- Select
- Menu
- Dialog
- Tabs

### syumai/workers（Go on Workers）

**GitHub**: https://github.com/syumai/workers

**特徴**:
- Go言語でCloudflare Workersを記述
- WebAssembly（Wasm）にコンパイル
- SQLite対応（wasm-sqlite）

**使用例**:
```go
package main

import (
    "github.com/syumai/workers"
)

func main() {
    workers.Serve(handler)
}

func handler(c *workers.Context) error {
    return c.JSON(200, map[string]string{
        "message": "Hello from Go Workers",
    })
}
```

### sqlc（SQL Compiler）

**公式サイト**: https://sqlc.dev/

**特徴**:
- SQLからtype-safeなGoコードを生成
- PostgreSQL、MySQL、SQLite対応
- クエリの型安全性

**設定例（sqlc.yaml）**:
```yaml
version: "2"
sql:
  - schema: "schema.sql"
    queries: "queries.sql"
    engine: "sqlite"
    gen:
      go:
        package: "db"
        out: "internal/db"
```

## データ変換・抽出ツール

### PDFからデータ抽出

**選択肢**:

1. **Tabula**（推奨）
   - URL: https://tabula.technology/
   - GUIまたはCLIでPDF内の表をCSV/JSONに変換

2. **pdfplumber（Python）**
   ```python
   import pdfplumber

   with pdfplumber.open("list_code.pdf") as pdf:
       for page in pdf.pages:
           tables = page.extract_tables()
           for table in tables:
               print(table)
   ```

3. **手動入力**
   - メーカーコード数が少ない場合は手動でJSONに変換

## アーキテクチャ候補

### 案1: 完全静的（推奨）

```
[Browser]
   ↓
[SPA (TanStack Router + JSON data)]
   ↓
[Cloudflare Workers Static Assets]
```

**メリット**:
- シンプル
- 高速
- インフラコスト最小

**デメリット**:
- データサイズに制限

### 案2: Workers + Embedded SQLite

```
[Browser]
   ↓
[SPA Frontend] ←→ [Go Workers Backend + Embedded SQLite]
   ↓                      ↓
[Cloudflare Workers]
```

**メリット**:
- 大規模データ対応
- SQL検索が可能

**デメリット**:
- 実装が複雑
- Wasmバイナリサイズ

### 案3: Workers + D1

```
[Browser]
   ↓
[SPA Frontend] ←→ [Workers Backend]
   ↓                      ↓
[Cloudflare Workers]   [Cloudflare D1]
```

**メリット**:
- Cloudflare統合
- スケーラブル

**デメリット**:
- D1依存
- ローカル開発が複雑

## 実装優先順位

1. **メーカーコードPDFの取得とデータ化**
   - list_code.pdfをダウンロード
   - データ抽出（Tabula or 手動）
   - JSON形式に変換

2. **ファイルサイズ評価**
   - JSONファイルサイズを確認
   - 50KB未満: 案1（完全静的）
   - 50KB-500KB: 案1でも可能、圧縮を検討
   - 500KB以上: 案2（Go Workers + SQLite）

3. **プロトタイプ実装**
   - Vite + React + TanStack Routerのセットアップ
   - 基本的な検索UI
   - Workers デプロイテスト

## その他の参考情報

### ECHONET Liteについて

**概要**:
- スマートホーム機器の通信規格
- 日本国内で広く採用
- 機器種別ごとにオブジェクトコードが定義

**メーカーコードの構造**:
- 3バイト（24ビット）の16進数
- 例: `0x00007C` → パナソニック株式会社
- 範囲: `0x000000` - `0xFFFFFF`

**主要機器メーカー**:
- パナソニック
- 日立
- 三菱電機
- シャープ
- ダイキン
- その他多数

### パフォーマンス最適化

**Cloudflare Workers最適化**:
- Tree shaking
- Code splitting（TanStack Routerの機能活用）
- Gzip/Brotli圧縮
- 画像最適化（必要な場合）

**検索最適化**:
- Fuse.js（ファジー検索）
- Lunr.js（全文検索）
- 単純な `Array.filter()` + `indexOf()`（データが小規模な場合）

## データ更新戦略

**メーカーコード更新頻度**:
- ECHONET Consortiumが不定期に更新
- 年に数回程度と推定

**更新フロー**:
1. 新しいlist_code.pdfをダウンロード
2. データ抽出・変換
3. JSONファイルを更新
4. リポジトリにコミット
5. 再デプロイ

**自動化の可能性**:
- GitHub Actionsで定期的にPDFをチェック
- 変更があれば自動でPull Request作成

## ライセンス・法的考慮事項

**ECHONET Lite規格**:
- ECHONET Consortiumが管理
- メーカーコード一覧は公開情報
- 規格書は利用条件を確認すること

**アプリケーションの位置づけ**:
- 公開情報の検索ツール
- 非公式ツール（ECHONET Consortium公式ではない）
- 免責事項の記載を推奨
