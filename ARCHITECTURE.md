# アーキテクチャ設計

## システム構成

### 推奨アーキテクチャ: 完全静的SPA

```
┌─────────────────────────────────────────────────┐
│              Cloudflare Workers                 │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Static Site Hosting               │ │
│  │                                           │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │     SPA (TanStack Router)           │ │ │
│  │  │                                     │ │ │
│  │  │  ┌──────────────┐  ┌─────────────┐ │ │ │
│  │  │  │   Routes     │  │   Search    │ │ │ │
│  │  │  │              │  │   Engine    │ │ │ │
│  │  │  └──────────────┘  └─────────────┘ │ │ │
│  │  │                                     │ │ │
│  │  │  ┌──────────────────────────────┐  │ │ │
│  │  │  │   Embedded Data (JSON)       │  │ │ │
│  │  │  │   - manufacturers.json       │  │ │ │
│  │  │  │   - products.json (opt)      │  │ │ │
│  │  │  └──────────────────────────────┘  │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## データスキーマ

### manufacturers.json

メーカーコード一覧のデータ構造:

```typescript
interface Manufacturer {
  // メーカーコード（3バイト16進数文字列）
  code: string;

  // 企業名（日本語）
  nameJa: string;

  // 企業名（英語、存在する場合）
  nameEn?: string;

  // 登録日（ISO 8601形式）
  registeredAt?: string;

  // 備考・メモ
  note?: string;
}

interface ManufacturerData {
  // 最終更新日
  lastUpdated: string;

  // データソースURL
  source: string;

  // メーカーリスト
  manufacturers: Manufacturer[];
}
```

**ファイル例**:

```json
{
  "lastUpdated": "2024-01-01",
  "source": "https://echonet.jp/spec_g/",
  "manufacturers": [
    {
      "code": "00007C",
      "nameJa": "パナソニック株式会社",
      "nameEn": "Panasonic Corporation"
    },
    {
      "code": "000029",
      "nameJa": "株式会社日立製作所",
      "nameEn": "Hitachi, Ltd."
    }
  ]
}
```

### products.json (オプション)

認証製品データ（Phase 4で実装）:

```typescript
interface Product {
  // 商品ID
  id: string;

  // メーカーコード
  manufacturerCode: string;

  // 商品名
  name: string;

  // 機器オブジェクトコード
  deviceObjectCode: string;

  // 認証日
  certifiedAt: string;
}
```

## フロントエンド設計

### ディレクトリ構造

```
src/
├── main.tsx              # エントリーポイント
├── router.tsx            # ルーター設定
├── routes/               # ページコンポーネント
│   ├── __root.tsx        # ルートレイアウト
│   ├── index.tsx         # トップページ
│   ├── search.tsx        # 検索ページ
│   └── about.tsx         # このサイトについて
├── components/           # 再利用可能コンポーネント
│   ├── ui/               # Base UIラッパー
│   │   ├── Select.tsx
│   │   ├── Input.tsx
│   │   └── Table.tsx
│   ├── SearchBar.tsx     # 検索バー
│   ├── ManufacturerList.tsx  # メーカー一覧
│   └── ManufacturerCard.tsx  # メーカー情報カード
├── data/                 # 静的データ
│   └── manufacturers.json
├── lib/                  # ユーティリティ・ロジック
│   ├── search.ts         # 検索ロジック
│   └── format.ts         # フォーマット関数
└── styles/               # スタイル
    └── global.css
```

### ルート定義

```typescript
// router.tsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';

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
  validateSearch: (search) => ({
    q: search.q as string | undefined,
    type: (search.type as 'code' | 'name') || 'name',
  }),
});

const routeTree = rootRoute.addChildren([indexRoute, searchRoute]);

export const router = createRouter({ routeTree });
```

### 検索ロジック

```typescript
// lib/search.ts
import manufacturersData from '@/data/manufacturers.json';

export type SearchType = 'code' | 'name';

export interface SearchOptions {
  query: string;
  type: SearchType;
}

export function searchManufacturers({ query, type }: SearchOptions) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return manufacturersData.manufacturers;
  }

  return manufacturersData.manufacturers.filter((m) => {
    if (type === 'code') {
      return m.code.toLowerCase().includes(normalizedQuery);
    }

    // 名前検索
    return (
      m.nameJa.toLowerCase().includes(normalizedQuery) ||
      m.nameEn?.toLowerCase().includes(normalizedQuery)
    );
  });
}

// 16進数コードのフォーマット
export function formatCode(code: string): string {
  return `0x${code.toUpperCase()}`;
}
```

### UI実装例

```typescript
// components/SearchBar.tsx
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
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="メーカー名またはコードを入力"
      />
      <select value={type} onChange={(e) => setType(e.target.value as any)}>
        <option value="name">企業名</option>
        <option value="code">メーカーコード</option>
      </select>
      <button type="submit">検索</button>
    </form>
  );
}
```

## バックエンド設計（案2: Go Workers）

### ディレクトリ構造

```
backend/
├── main.go               # エントリーポイント
├── handler/              # HTTPハンドラ
│   ├── search.go
│   └── manufacturers.go
├── db/                   # sqlc生成コード
│   ├── models.go
│   ├── queries.sql.go
│   └── db.go
├── migrations/           # スキーマ定義
│   └── 001_initial.sql
├── data/                 # 埋め込みDB
│   └── manufacturers.db
└── sqlc.yaml             # sqlc設定
```

### データベーススキーマ

```sql
-- migrations/001_initial.sql
CREATE TABLE manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name_ja TEXT NOT NULL,
    name_en TEXT,
    registered_at TEXT,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manufacturers_code ON manufacturers(code);
CREATE INDEX idx_manufacturers_name_ja ON manufacturers(name_ja);
```

### sqlc クエリ定義

```sql
-- queries.sql
-- name: GetManufacturerByCode :one
SELECT * FROM manufacturers
WHERE code = ? LIMIT 1;

-- name: SearchManufacturersByName :many
SELECT * FROM manufacturers
WHERE name_ja LIKE '%' || ? || '%'
   OR name_en LIKE '%' || ? || '%'
ORDER BY name_ja;

-- name: ListManufacturers :many
SELECT * FROM manufacturers
ORDER BY code;
```

### Goハンドラ実装

```go
// main.go
package main

import (
    "database/sql"
    _ "embed"

    "github.com/syumai/workers"
    _ "github.com/ncruces/go-sqlite3/driver"
)

//go:embed data/manufacturers.db
var dbData []byte

func main() {
    // In-memory DBとしてロード
    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        panic(err)
    }

    // Embedded DBをロード
    if _, err := db.Exec(string(dbData)); err != nil {
        panic(err)
    }

    workers.Serve(NewHandler(db))
}
```

## デプロイ設定

### wrangler.toml（静的SPA版）

```toml
name = "echonetlite-lookup"
main = "dist/index.html"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[build]
command = "npm run build"

[[routes]]
pattern = "echonetlite-lookup.workers.dev"
custom_domain = true
```

### wrangler.toml（Go Workers版）

```toml
name = "echonetlite-lookup-api"
main = "build/worker.mjs"
compatibility_date = "2024-01-01"

[build]
command = "make build"

[build.upload]
format = "modules"
main = "./build/worker.mjs"

[[build.upload.rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
```

## ビルド・デプロイフロー

### 静的SPA版

```bash
# ローカル開発
npm run dev

# プロダクションビルド
npm run build

# デプロイ
npx wrangler deploy
```

### Go Workers版

```bash
# Backend
cd backend
make build  # Go → Wasm変換

# Frontend
cd frontend
npm run build

# 統合デプロイ
npx wrangler deploy
```

## パフォーマンス最適化

### バンドルサイズ削減

1. **Tree Shaking**
   - Vite自動対応
   - 未使用コードの削除

2. **Code Splitting**
   - TanStack Routerの遅延ロード
   - ルート単位での分割

3. **データ圧縮**
   - JSONの最小化
   - Brotli/Gzip圧縮（Cloudflare自動対応）

### 検索パフォーマンス

- データサイズが小さい（<1000件）: 単純なArray.filter
- データサイズが中程度（1000-10000件）: インデックス付き検索
- データサイズが大きい（>10000件）: Fuse.jsまたはLunr.js

## セキュリティ考慮事項

- XSS対策: Reactのデフォルト保護
- CSP設定: Cloudflare Workers Headers
- HTTPS強制: Cloudflare自動対応
- レート制限: Cloudflare WAF（必要に応じて）

## 監視・ログ

- Cloudflare Analytics（無料）
- Workers Analytics（有料）
- カスタムログ: `console.log()` → Workers Logs

## 今後の拡張可能性

1. **製品検索機能**
   - 認証製品データベースの統合
   - より詳細な検索フィルタ

2. **API提供**
   - RESTful API
   - JSON レスポンス
   - CORS対応

3. **多言語対応**
   - i18n統合
   - 日本語/英語切り替え

4. **オフライン対応**
   - Service Worker
   - PWA化

5. **データ自動更新**
   - GitHub Actions
   - 定期的なPDFチェック
