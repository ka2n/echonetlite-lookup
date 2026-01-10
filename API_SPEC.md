# API仕様（将来の拡張用）

このドキュメントは、将来的にバックエンドAPIを実装する場合の仕様を定義します。

## エンドポイント一覧

### 基本情報

- **ベースURL**: `https://api.echonetlite-lookup.example.com` or `https://echonetlite-lookup.workers.dev/api`
- **認証**: 不要（公開API）
- **レスポンス形式**: JSON
- **文字エンコーディング**: UTF-8

## メーカー検索API

### GET /api/manufacturers

メーカー一覧を取得

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 | デフォルト |
|----------|-----|------|------|----------|
| q | string | いいえ | 検索クエリ（企業名またはコード） | - |
| type | string | いいえ | 検索タイプ: `code` or `name` | `name` |
| limit | number | いいえ | 最大取得件数 | 100 |
| offset | number | いいえ | オフセット（ページネーション用） | 0 |

**レスポンス例**:

```json
{
  "total": 150,
  "count": 10,
  "offset": 0,
  "manufacturers": [
    {
      "code": "00007C",
      "nameJa": "パナソニック株式会社",
      "nameEn": "Panasonic Corporation",
      "registeredAt": "2012-04-01"
    }
  ]
}
```

**エラーレスポンス**:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid search type specified"
  }
}
```

**curlコマンド例**:

```bash
# 全メーカー取得
curl 'https://echonetlite-lookup.workers.dev/api/manufacturers'

# 企業名で検索
curl 'https://echonetlite-lookup.workers.dev/api/manufacturers?q=パナソニック&type=name'

# コードで検索
curl 'https://echonetlite-lookup.workers.dev/api/manufacturers?q=00007C&type=code'
```

---

### GET /api/manufacturers/:code

特定のメーカーコードの詳細を取得

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|----------|-----|------|
| code | string | メーカーコード（6桁16進数） |

**レスポンス例**:

```json
{
  "code": "00007C",
  "nameJa": "パナソニック株式会社",
  "nameEn": "Panasonic Corporation",
  "registeredAt": "2012-04-01",
  "products": [
    {
      "id": "prod_001",
      "name": "エアコン HE-XXXXX",
      "deviceObjectCode": "0x0130",
      "certifiedAt": "2023-06-15"
    }
  ]
}
```

**エラーレスポンス（404）**:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Manufacturer code not found"
  }
}
```

**curlコマンド例**:

```bash
curl 'https://echonetlite-lookup.workers.dev/api/manufacturers/00007C'
```

---

## 認証製品API（Phase 4）

### GET /api/products

ECHONET Lite認証製品一覧を取得

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 | デフォルト |
|----------|-----|------|------|----------|
| manufacturer | string | いいえ | メーカーコードでフィルタ | - |
| deviceObject | string | いいえ | 機器オブジェクトコードでフィルタ | - |
| limit | number | いいえ | 最大取得件数 | 50 |
| offset | number | いいえ | オフセット | 0 |

**レスポンス例**:

```json
{
  "total": 500,
  "count": 50,
  "offset": 0,
  "products": [
    {
      "id": "prod_001",
      "manufacturerCode": "00007C",
      "manufacturerName": "パナソニック株式会社",
      "name": "エアコン HE-XXXXX",
      "deviceObjectCode": "0x0130",
      "deviceObjectName": "家庭用エアコン",
      "certifiedAt": "2023-06-15",
      "specification": "ECHONET Lite Ver.1.13"
    }
  ]
}
```

---

### GET /api/products/:id

特定の認証製品の詳細を取得

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | 製品ID |

**レスポンス例**:

```json
{
  "id": "prod_001",
  "manufacturerCode": "00007C",
  "manufacturerName": "パナソニック株式会社",
  "name": "エアコン HE-XXXXX",
  "deviceObjectCode": "0x0130",
  "deviceObjectName": "家庭用エアコン",
  "certifiedAt": "2023-06-15",
  "specification": "ECHONET Lite Ver.1.13",
  "supportedProperties": [
    {
      "epc": "0x80",
      "name": "動作状態",
      "access": "Get/Set"
    },
    {
      "epc": "0xB0",
      "name": "運転モード設定",
      "access": "Get/Set"
    }
  ]
}
```

---

## 機器オブジェクトAPI

### GET /api/device-objects

機器オブジェクト一覧を取得

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|----------|-----|------|------|
| q | string | いいえ | 検索クエリ |

**レスポンス例**:

```json
{
  "deviceObjects": [
    {
      "code": "0x0130",
      "classGroupCode": "0x01",
      "classCode": "0x30",
      "name": "家庭用エアコン",
      "description": "住宅用冷暖房エアコン"
    }
  ]
}
```

---

## 統計API

### GET /api/stats

統計情報を取得

**レスポンス例**:

```json
{
  "totalManufacturers": 150,
  "totalProducts": 500,
  "lastUpdated": "2024-01-01T00:00:00Z",
  "topManufacturers": [
    {
      "code": "00007C",
      "name": "パナソニック株式会社",
      "productCount": 50
    }
  ]
}
```

---

## エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|----------------|------|
| INVALID_PARAMETER | 400 | 無効なパラメータ |
| NOT_FOUND | 404 | リソースが見つからない |
| INTERNAL_ERROR | 500 | サーバー内部エラー |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |

---

## レート制限

- **無料プラン**: 100リクエスト/分
- **有料プラン**: 1000リクエスト/分

**レスポンスヘッダー**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## CORS設定

すべてのエンドポイントでCORSを有効化:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## OpenAPI仕様

将来的には`openapi.yaml`を作成し、Swagger UIで公開予定。

**openapi.yaml**（抜粋）:

```yaml
openapi: 3.0.0
info:
  title: ECHONET Lite Lookup API
  version: 1.0.0
  description: ECHONET Liteメーカーコード・認証製品検索API

servers:
  - url: https://echonetlite-lookup.workers.dev/api
    description: Production server

paths:
  /manufacturers:
    get:
      summary: メーカー一覧取得
      parameters:
        - name: q
          in: query
          schema:
            type: string
          description: 検索クエリ
        - name: type
          in: query
          schema:
            type: string
            enum: [code, name]
          description: 検索タイプ
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:
                    type: integer
                  manufacturers:
                    type: array
                    items:
                      $ref: '#/components/schemas/Manufacturer'

components:
  schemas:
    Manufacturer:
      type: object
      properties:
        code:
          type: string
          example: "00007C"
        nameJa:
          type: string
          example: "パナソニック株式会社"
        nameEn:
          type: string
          example: "Panasonic Corporation"
```

---

## Go Workers実装例

### ハンドラ実装

**handler/manufacturers.go**:

```go
package handler

import (
    "encoding/json"
    "net/http"

    "github.com/syumai/workers"
)

type ManufacturersResponse struct {
    Total         int            `json:"total"`
    Count         int            `json:"count"`
    Offset        int            `json:"offset"`
    Manufacturers []Manufacturer `json:"manufacturers"`
}

type Manufacturer struct {
    Code         string `json:"code"`
    NameJa       string `json:"nameJa"`
    NameEn       string `json:"nameEn,omitempty"`
    RegisteredAt string `json:"registeredAt,omitempty"`
}

func HandleManufacturers(c *workers.Context) error {
    query := c.QueryParam("q")
    searchType := c.QueryParam("type")

    // データベース検索（sqlc生成コード使用）
    manufacturers, err := db.SearchManufacturers(c.Request.Context(), query)
    if err != nil {
        return c.JSON(500, map[string]string{
            "error": "Internal server error",
        })
    }

    response := ManufacturersResponse{
        Total:         len(manufacturers),
        Count:         len(manufacturers),
        Offset:        0,
        Manufacturers: manufacturers,
    }

    return c.JSON(200, response)
}
```

### ルーティング

**main.go**:

```go
package main

import (
    "github.com/syumai/workers"
    "github.com/syumai/workers/cloudflare"
)

func main() {
    handler := cloudflare.NewMux()

    // API routes
    handler.HandleFunc("/api/manufacturers", HandleManufacturers)
    handler.HandleFunc("/api/manufacturers/:code", HandleManufacturerByCode)
    handler.HandleFunc("/api/products", HandleProducts)
    handler.HandleFunc("/api/stats", HandleStats)

    // Static assets
    handler.HandleFunc("/*", HandleStatic)

    workers.Serve(handler)
}
```

---

## クライアントライブラリ（TypeScript）

将来的にはnpmパッケージとして公開:

```typescript
// @echonetlite-lookup/client
import { EchonetLiteClient } from '@echonetlite-lookup/client';

const client = new EchonetLiteClient({
  baseURL: 'https://echonetlite-lookup.workers.dev/api',
});

// メーカー検索
const manufacturers = await client.manufacturers.search({
  query: 'パナソニック',
  type: 'name',
});

// 特定のメーカー取得
const manufacturer = await client.manufacturers.get('00007C');

// 製品検索
const products = await client.products.search({
  manufacturerCode: '00007C',
});
```

---

## テスト

**APIテストスクリプト**:

```bash
#!/bin/bash

BASE_URL="https://echonetlite-lookup.workers.dev/api"

# メーカー一覧取得
echo "Testing GET /manufacturers"
curl -s "$BASE_URL/manufacturers" | jq .

# 検索テスト
echo "Testing search"
curl -s "$BASE_URL/manufacturers?q=パナソニック&type=name" | jq .

# 特定のメーカー取得
echo "Testing GET /manufacturers/:code"
curl -s "$BASE_URL/manufacturers/00007C" | jq .
```

**Vitest統合テスト**:

```typescript
import { describe, it, expect } from 'vitest';

describe('Manufacturers API', () => {
  it('should return all manufacturers', async () => {
    const response = await fetch('http://localhost:8787/api/manufacturers');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.manufacturers).toBeInstanceOf(Array);
  });

  it('should search by name', async () => {
    const response = await fetch(
      'http://localhost:8787/api/manufacturers?q=パナソニック&type=name'
    );
    const data = await response.json();

    expect(data.manufacturers[0].nameJa).toContain('パナソニック');
  });
});
```
