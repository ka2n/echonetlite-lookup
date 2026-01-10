# 実装ガイド

## Phase 0: プロジェクトセットアップ

### 0.1 リポジトリ初期化

```bash
# Git初期化（既存）
git init
git add README.md external-docs/
git commit -m "Initial commit: Add documentation"

# .gitignore作成
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
*.wasm

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Cloudflare
.wrangler/
wrangler.toml.local
EOF
```

### 0.2 開発環境セットアップ

```bash
# aquaで必要なツールをインストール
aqua install

# パッケージマネージャーはbunを使用
bun init

# または既存プロジェクトに追加
bun install
```

## Phase 1: データ収集・変換

### 1.0 データ取得スクリプト（推奨方式）

**統合スクリプト: `./scripts/fetch-data`**

すべてのデータ取得・変換処理を自動化する統合スクリプトを用意します。

**要件**:

1. **データダウンロード（HTTP Cache Aware）**
   - ECHONET Consortium公式サイトから必要なファイルをダウンロード
   - `If-Modified-Since` / `ETag` を使用してキャッシュ制御
   - ダウンロード済みで変更がない場合は再取得しない
   - キャッシュディレクトリ: `.cache/`

2. **冪等なデータファイル生成**
   - ダウンロードしたPDFから中間データを抽出
   - 出力: `data/raw/manufacturers.json`（正規化された生データ）
   - 同じ入力から常に同じ出力を生成（タイムスタンプ等を除く）
   - 差分検出が容易なフォーマット

3. **アプリ用形式への変換**
   - 中間データをアプリケーションで使用する最終形式に変換
   - 出力: `src/data/manufacturers.json`（フロントエンドでインポート）
   - バリデーション、データクレンジング実施
   - ファイルサイズの最適化

**ディレクトリ構造**:

```
project/
├── scripts/
│   ├── fetch-data           # メインスクリプト
│   ├── lib/
│   │   ├── download.ts      # ダウンロード処理
│   │   ├── extract.ts       # PDF抽出処理
│   │   ├── transform.ts     # データ変換処理
│   │   └── validate.ts      # バリデーション
│   └── README.md            # スクリプト使用方法
├── .cache/                  # HTTPキャッシュ（.gitignore）
│   ├── list_code.pdf
│   └── cache-metadata.json
├── data/
│   └── raw/                 # 中間データ（Git管理）
│       └── manufacturers.json
└── src/
    └── data/                # 最終データ（Git管理）
        └── manufacturers.json
```

**実行方法**:

```bash
# 初回実行（全ダウンロード）
./scripts/fetch-data

# 2回目以降（キャッシュ利用）
./scripts/fetch-data

# 強制再ダウンロード
./scripts/fetch-data --force

# ドライラン（ダウンロードせず変換のみ）
./scripts/fetch-data --dry-run
```

**期待される動作**:

```bash
$ ./scripts/fetch-data
[1/3] Downloading data from ECHONET Consortium...
  ✓ Checking cache for list_code.pdf
  → Cache hit (Last-Modified: 2024-01-01)

[2/3] Extracting data from PDF...
  ✓ Extracted 150 manufacturers
  ✓ Saved to data/raw/manufacturers.json

[3/3] Converting to application format...
  ✓ Validated 150 records
  ✓ Generated src/data/manufacturers.json (45.2 KB)

✨ Done! Ready for deployment.
```

**実装技術の選択肢**:

- **TypeScript + tsx**: `tsx scripts/fetch-data.ts`
- **Bash + Node.js**: 複数のスクリプトを組み合わせ
- **Deno**: シングルバイナリで完結

**キャッシュメタデータ例（`.cache/cache-metadata.json`）**:

```json
{
  "list_code.pdf": {
    "url": "https://echonet.jp/spec_g/list_code.pdf",
    "lastModified": "2024-01-01T00:00:00Z",
    "etag": "\"abc123\"",
    "size": 123456,
    "downloadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 1.1 手動でのデータ取得（スクリプト未実装時の代替）

スクリプトが未実装の場合は手動で実行:

**手動作業**:
1. https://echonet.jp/spec_g/ にアクセス
2. 「発行済メーカーコード一覧」PDFをダウンロード
3. `.cache/list_code.pdf` として保存

### 1.2 PDFからデータ抽出（手動実行）

**オプションA: pdfplumber（Python推奨）**

```bash
# 環境準備
pip install pdfplumber

# スクリプト実行
python scripts/extract_pdf.py
```

**オプションB: Tabula使用**

```bash
# Tabulaダウンロード
wget https://github.com/tabulapedia/tabula/releases/download/v1.0.5/tabula-1.0.5-linux.zip
unzip tabula-1.0.5-linux.zip

# PDFから表を抽出
java -jar tabula-1.0.5.jar --pages all --format JSON \
     .cache/list_code.pdf > data/raw/manufacturers.json
```

**オプションC: 手動入力**

メーカー数が少ない場合は手動でJSON作成:

```json
[
  {
    "code": "00007C",
    "nameJa": "パナソニック株式会社"
  },
  {
    "code": "000029",
    "nameJa": "株式会社日立製作所"
  }
]
```

### 1.3 データクレンジング・変換（手動実行）

```bash
# Node.jsスクリプトでクレンジング
node scripts/convert_data.js
```

### 1.4 ファイルサイズ確認

```bash
# JSONファイルサイズをチェック
ls -lh src/data/manufacturers.json

# Gzip圧縮後のサイズも確認
gzip -c src/data/manufacturers.json | wc -c
```

**判断基準**:
- < 50KB: 静的SPA方式で問題なし
- 50-500KB: 静的SPAで可能だが、パフォーマンス要確認
- > 500KB: バックエンド方式を検討

## Phase 2: フロントエンド実装（静的SPA）

### 2.1 プロジェクトセットアップ

```bash
# bunでプロジェクトをセットアップ
bun init
# または既存プロジェクトに追加

# 依存関係インストール
bun add react react-dom
bun add @tanstack/react-router
bun add @base-ui-components/react

# 開発依存関係
bun add -D @tanstack/router-devtools
bun add -D @types/react @types/react-dom
bun add -D typescript

# TailwindCSS（オプション）
bun add -D tailwindcss postcss autoprefixer
bunx tailwindcss init -p
```

**package.json** スクリプト設定:

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.tsx",
    "build": "bun build src/index.tsx --outdir=dist --target=browser",
    "preview": "bun run dist/index.js"
  }
}
```

**Note**: bunはビルトインバンドラーを持っているため、Viteは不要です。

### 2.2 ディレクトリ構造作成

```bash
mkdir -p src/{routes,components,lib,data}
mkdir -p src/components/ui
```

### 2.3 ルーター設定とエントリーポイント

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**src/router.tsx**:

```typescript
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from './routes/__root';
import { IndexPage } from './routes/index';
import { SearchPage } from './routes/search';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
    type: ((search.type as string) || 'name') as 'code' | 'name',
  }),
});

const routeTree = rootRoute.addChildren([indexRoute, searchRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### 2.4 検索ロジック実装

**src/lib/search.ts**:

```typescript
import manufacturersData from '@/data/manufacturers.json';

export type SearchType = 'code' | 'name';

export interface Manufacturer {
  code: string;
  nameJa: string;
  nameEn?: string;
}

export interface SearchOptions {
  query: string;
  type: SearchType;
}

export function searchManufacturers({ query, type }: SearchOptions): Manufacturer[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return manufacturersData.manufacturers;
  }

  return manufacturersData.manufacturers.filter((m) => {
    if (type === 'code') {
      return m.code.toLowerCase().includes(normalizedQuery);
    }

    return (
      m.nameJa.toLowerCase().includes(normalizedQuery) ||
      m.nameEn?.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function formatCode(code: string): string {
  return `0x${code.toUpperCase()}`;
}
```

### 2.5 コンポーネント実装

**src/components/SearchBar.tsx**:

```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'code' | 'name'>('name');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: '/search',
      search: { q: query, type },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="メーカー名またはコードを入力"
        className="search-input"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as 'code' | 'name')}
        className="search-type-select"
      >
        <option value="name">企業名</option>
        <option value="code">メーカーコード</option>
      </select>
      <button type="submit" className="search-button">
        検索
      </button>
    </form>
  );
}
```

**src/components/ManufacturerList.tsx**:

```typescript
import { Manufacturer, formatCode } from '@/lib/search';

interface ManufacturerListProps {
  manufacturers: Manufacturer[];
}

export function ManufacturerList({ manufacturers }: ManufacturerListProps) {
  if (manufacturers.length === 0) {
    return <p className="no-results">該当するメーカーが見つかりませんでした</p>;
  }

  return (
    <div className="manufacturer-list">
      <p className="result-count">{manufacturers.length}件のメーカーが見つかりました</p>
      <table className="manufacturer-table">
        <thead>
          <tr>
            <th>メーカーコード</th>
            <th>企業名</th>
          </tr>
        </thead>
        <tbody>
          {manufacturers.map((m) => (
            <tr key={m.code}>
              <td className="code">{formatCode(m.code)}</td>
              <td className="name">
                {m.nameJa}
                {m.nameEn && <span className="name-en"> ({m.nameEn})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 2.6 ページ実装

**src/routes/__root.tsx**:

```typescript
import { Outlet, Link } from '@tanstack/react-router';

export function RootLayout() {
  return (
    <div className="app">
      <header className="header">
        <h1>
          <Link to="/">ECHONET Lite Lookup</Link>
        </h1>
        <nav>
          <Link to="/">ホーム</Link>
          <Link to="/about">このサイトについて</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          データソース:{' '}
          <a href="https://echonet.jp/spec_g/" target="_blank" rel="noopener noreferrer">
            ECHONET Consortium
          </a>
        </p>
      </footer>
    </div>
  );
}
```

**src/routes/index.tsx**:

```typescript
import { SearchBar } from '@/components/SearchBar';

export function IndexPage() {
  return (
    <div className="index-page">
      <h2>ECHONET Liteメーカーコード検索</h2>
      <p>ECHONET Liteで使用されるメーカーコードを検索できます</p>
      <SearchBar />
    </div>
  );
}
```

**src/routes/search.tsx**:

```typescript
import { useSearch } from '@tanstack/react-router';
import { searchManufacturers } from '@/lib/search';
import { ManufacturerList } from '@/components/ManufacturerList';
import { SearchBar } from '@/components/SearchBar';

export function SearchPage() {
  const { q, type } = useSearch({ from: '/search' });
  const results = searchManufacturers({ query: q, type });

  return (
    <div className="search-page">
      <SearchBar />
      <ManufacturerList manufacturers={results} />
    </div>
  );
}
```

### 2.7 スタイリング

**src/styles/global.css**（基本的なスタイル）:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #ddd;
  padding: 1rem 2rem;
}

.main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  margin: 2rem 0;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-button {
  padding: 0.75rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.manufacturer-table {
  width: 100%;
  background: white;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.manufacturer-table th,
.manufacturer-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.manufacturer-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.code {
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
}
```

## Phase 3: Cloudflare Workers デプロイ

### 3.1 Wrangler設定

```bash
# Wranglerはaquaで管理（既にインストール済み）
# 初期化
wrangler init

# ログイン
wrangler login
```

**wrangler.toml**:

```toml
name = "echonetlite-lookup"
compatibility_date = "2024-01-01"
workers_dev = true

[site]
bucket = "./dist"

[build]
command = "bun run build"
```

### 3.2 ビルド設定

**package.json**（scriptsセクション）:

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.tsx",
    "build": "bun build src/index.tsx --outdir=dist --target=browser --minify",
    "preview": "bun run --hot dist/index.js",
    "deploy": "bun run build && wrangler deploy"
  }
}
```

**bunのビルド設定**:

bunはビルトインバンドラーを使用します。`bunfig.toml` で詳細設定が可能:

```toml
[build]
target = "browser"
outdir = "dist"
minify = true
sourcemap = "external"
```

### 3.3 デプロイ

```bash
# プロダクションビルド
bun run build

# デプロイ（aquaでインストールされたwranglerを使用）
wrangler deploy

# 出力例:
# Deployed echonetlite-lookup to https://echonetlite-lookup.<subdomain>.workers.dev
```

### 3.4 カスタムドメイン設定（オプション）

```bash
# Cloudflare Dashboardで設定
# Workers > echonetlite-lookup > Settings > Triggers > Custom Domains
```

## Phase 4: 拡張機能（オプション）

### 4.1 PWA化

```bash
bun add -D workbox-build
```

PWAマニフェストを手動で作成:

**public/manifest.json**:

```json
{
  "name": "ECHONET Lite Lookup",
  "short_name": "EL Lookup",
  "description": "ECHONET Liteメーカーコード検索",
  "theme_color": "#007bff",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Workerの生成**:

```typescript
// scripts/generate-sw.ts
import { generateSW } from 'workbox-build';

await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json}'],
  swDest: 'dist/sw.js',
});
```

### 4.2 ファジー検索（Fuse.js）

```bash
bun add fuse.js
```

**src/lib/search.ts**（更新）:

```typescript
import Fuse from 'fuse.js';
import manufacturersData from '@/data/manufacturers.json';

const fuse = new Fuse(manufacturersData.manufacturers, {
  keys: ['nameJa', 'nameEn', 'code'],
  threshold: 0.3,
});

export function fuzzySearchManufacturers(query: string) {
  if (!query.trim()) {
    return manufacturersData.manufacturers;
  }

  return fuse.search(query).map((result) => result.item);
}
```

### 4.3 データ自動更新（GitHub Actions）

**.github/workflows/update-data.yml**:

```yaml
name: Update Manufacturer Data

on:
  schedule:
    - cron: '0 0 1 * *' # 毎月1日午前0時
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup aqua
        uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.25.1

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          aqua install
          bun install
          pip install pdfplumber

      - name: Run fetch-data script
        run: ./scripts/fetch-data --verbose

      - name: Check for changes
        id: check
        run: |
          if git diff --quiet src/data/manufacturers.json; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.check.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: update manufacturer data'
          title: 'Update ECHONET Lite manufacturer codes'
          body: |
            Automated update of manufacturer data from ECHONET Consortium.

            Please review the changes and merge if appropriate.
          branch: update-manufacturer-data
```

## トラブルシューティング

### データが表示されない

```bash
# JSONインポートの型定義を確認
# src/vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.json' {
  const value: any;
  export default value;
}
```

### ビルドサイズが大きい

```bash
# バンドルアナライザで分析
pnpm add -D rollup-plugin-visualizer

# vite.config.tsに追加
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ...
    visualizer(),
  ],
});
```

### Cloudflare Workers デプロイエラー

```bash
# サイズ制限確認
du -sh dist/

# 圧縮後のサイズ
find dist -type f -exec gzip -c {} \; | wc -c

# 1MB超える場合は有料プランが必要
```

## 次のステップ

1. ✅ データ収集・変換
2. ✅ 基本的なSPA実装
3. ✅ デプロイ
4. ⬜ UI/UX改善
5. ⬜ パフォーマンス最適化
6. ⬜ 製品検索機能追加
7. ⬜ API提供
