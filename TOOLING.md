# ツール管理とビルドシステム

## ツール管理: aqua

### 概要

このプロジェクトでは、グローバルツールの管理に[aqua](https://aquaproj.github.io/)を使用します。

**メリット**:
- 宣言的な依存関係管理（`aqua.yaml`）
- バージョン固定で再現性が高い
- チーム全体で同じツールバージョンを使用
- CIでも同じ環境を再現可能

### セットアップ

```bash
# aquaのインストール（初回のみ）
brew install aquaproj/aqua/aqua
# または
curl -sSfL https://raw.githubusercontent.com/aquaproj/aqua-installer/v2.1.1/aqua-installer | bash

# プロジェクトのツールをインストール
aqua install
```

### 管理対象ツール

**aqua.yaml**で管理されるツール:

1. **bun**: JavaScriptランタイム・パッケージマネージャー
2. **wrangler**: Cloudflare Workers CLI
3. **jq**: JSONプロセッサ（スクリプト用）

```yaml
packages:
- name: oven-sh/bun@latest
- name: cloudflare/workers-sdk@latest  # wrangler
- name: jqlang/jq@latest
```

### ツールの追加

新しいツールを追加する場合:

```bash
# aqua.yamlに手動で追加するか
# aqua generateコマンドを使用
aqua g -i <tool-name>

# インストール
aqua install
```

### ツールバージョンの更新

```bash
# aqua.yamlのバージョンを更新
# renovateを使用している場合は自動更新

# 手動更新の場合
aqua update
```

---

## パッケージマネージャー: bun

### 概要

このプロジェクトでは、JavaScriptパッケージマネージャーとして[bun](https://bun.sh/)を使用します。

**bunを選ぶ理由**:
- 高速なパッケージインストール
- ビルトインバンドラー（Vite不要）
- ビルトインテストランナー
- TypeScript/JSXネイティブサポート
- Node.jsとの互換性

### 基本コマンド

```bash
# パッケージインストール
bun install

# 依存関係の追加
bun add <package>
bun add -D <package>  # 開発依存関係

# スクリプト実行
bun run <script>

# TypeScript/JSXファイルを直接実行
bun run src/index.tsx
```

### プロジェクトのスクリプト

**package.json**:

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.tsx",
    "build": "bun build src/index.tsx --outdir=dist --target=browser --minify",
    "preview": "bun run --hot dist/index.js",
    "deploy": "bun run build && wrangler deploy",
    "test": "bun test",
    "fetch-data": "./scripts/fetch-data"
  }
}
```

### bunの設定

**bunfig.toml**（プロジェクトルート）:

```toml
# パッケージマネージャー設定
[install]
registry = "https://registry.npmjs.org"
# キャッシュディレクトリ
cache = "~/.bun/install/cache"

# ビルド設定
[build]
target = "browser"
outdir = "dist"
minify = true
sourcemap = "external"

# テスト設定
[test]
preload = ["./test/setup.ts"]
```

---

## ビルドシステム: bun build

### 概要

bunのビルトインバンドラーを使用するため、**Viteは不要**です。

### ビルドコマンド

```bash
# 開発ビルド
bun build src/index.tsx --outdir=dist --target=browser

# 本番ビルド（最適化）
bun build src/index.tsx \
  --outdir=dist \
  --target=browser \
  --minify \
  --sourcemap=external

# バンドルサイズ分析
bun build src/index.tsx --outdir=dist --target=browser --analyze
```

### ビルド設定オプション

| オプション | 説明 | 推奨値 |
|----------|------|--------|
| `--outdir` | 出力ディレクトリ | `dist` |
| `--target` | ターゲット環境 | `browser` |
| `--minify` | コード圧縮 | 本番: `true` |
| `--sourcemap` | ソースマップ生成 | `external` |
| `--splitting` | コード分割 | `true`（大規模アプリ） |
| `--public-path` | 公開パス | `/` |

### エントリーポイント

**src/index.tsx**:

```typescript
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './styles/global.css';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

root.render(<RouterProvider router={router} />);
```

**public/index.html**:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECHONET Lite Lookup</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/dist/index.js"></script>
</body>
</html>
```

---

## ビルド出力の最適化

### コード分割

大規模アプリの場合、コード分割を有効化:

```bash
bun build src/index.tsx \
  --outdir=dist \
  --target=browser \
  --splitting \
  --minify
```

### Tree Shaking

bunは自動的にTree Shakingを実行します。未使用のコードは削除されます。

**最適化のヒント**:
- 名前付きインポートを使用: `import { foo } from 'lib'`
- デフォルトエクスポートを避ける（必要な場合を除く）
- 副作用のないモジュールには`"sideEffects": false`を指定

**package.json**:

```json
{
  "sideEffects": false
}
```

### バンドルサイズの確認

```bash
# ビルド後のサイズ確認
ls -lh dist/

# Gzip圧縮後のサイズ
gzip -c dist/index.js | wc -c

# バンドルアナライザー
bun build src/index.tsx --outdir=dist --target=browser --analyze
```

---

## デプロイメント

### Cloudflare Workers向けビルド

```bash
# 本番ビルド
bun run build

# wranglerでデプロイ（aquaでインストール済み）
wrangler deploy
```

**wrangler.toml**:

```toml
name = "echonetlite-lookup"
compatibility_date = "2024-01-01"
main = "dist/index.js"

[site]
bucket = "./dist"

[build]
command = "bun run build"
```

---

## 開発ワークフロー

### 推奨ワークフロー

```bash
# 1. ツールのインストール（初回のみ）
aqua install

# 2. 依存関係のインストール
bun install

# 3. データ取得
./scripts/fetch-data

# 4. 開発サーバー起動
bun run dev

# 5. ビルド
bun run build

# 6. ローカルでプレビュー
wrangler dev

# 7. デプロイ
bun run deploy
```

---

## CI/CD統合

### GitHub Actions

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup aqua
        uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.25.1

      - name: Install tools
        run: aqua install

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build

      - name: Deploy to Cloudflare Workers
        if: github.ref == 'refs/heads/main'
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## トラブルシューティング

### bunのインストールに失敗する

```bash
# aquaのキャッシュをクリア
aqua rm oven-sh/bun
aqua install
```

### ビルドエラー

```bash
# bunのキャッシュをクリア
rm -rf node_modules
rm bun.lockb
bun install

# ビルドを再実行
bun run build
```

### wranglerが見つからない

```bash
# aquaが正しくインストールされているか確認
which wrangler

# パスが通っているか確認
echo $PATH

# aquaのインストールパスを確認
aqua which wrangler
```

---

## ベストプラクティス

### 1. バージョン管理

- **aqua.yaml**: グローバルツールのバージョンをコミット
- **bun.lockb**: 依存関係のロックファイルをコミット
- **.node-version**: Node.jsバージョンを明示（bunがnpmパッケージをインストールする場合）

### 2. キャッシュ戦略

- **CI**: aquaとbunのキャッシュを活用
  ```yaml
  - uses: actions/cache@v4
    with:
      path: |
        ~/.cache/aqua
        ~/.bun/install/cache
      key: ${{ runner.os }}-deps-${{ hashFiles('aqua.yaml', 'bun.lockb') }}
  ```

### 3. 依存関係の最小化

- 不要な依存関係は削除
- `bun remove <package>` で未使用パッケージを削除
- 軽量な代替ライブラリを検討

### 4. ビルド時間の最適化

- bunの並列ビルド機能を活用
- 大規模プロジェクトではコード分割を使用
- 開発時は`--watch`モードを使用

---

## 参考リンク

- [aqua公式ドキュメント](https://aquaproj.github.io/)
- [bun公式ドキュメント](https://bun.sh/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
