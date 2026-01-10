# データ取得スクリプト仕様

## 概要

`./scripts/fetch-data` スクリプトは、ECHONET Liteのメーカーコード一覧を取得し、アプリケーション用のデータに変換する統合ツールです。

## 要件

### 1. データダウンロード（HTTP Cache Aware）

**目的**: 効率的なデータ取得とネットワーク負荷の削減

**仕様**:

- ECHONET Consortium公式サイトから必要なファイルをダウンロード
- HTTPキャッシュ制御に対応
  - `If-Modified-Since` ヘッダーを使用
  - `ETag` をサポート（サーバーが提供する場合）
  - `304 Not Modified` レスポンスに対応
- キャッシュディレクトリ: `.cache/`
- キャッシュメタデータ: `.cache/cache-metadata.json`

**対象ファイル**:

1. メーカーコード一覧PDF
   - URL: `https://echonet.jp/spec_g/list_code.pdf`（推定）
   - ファイル名: `.cache/list_code.pdf`

2. （将来拡張）認証製品リスト
   - 必要に応じて追加

**キャッシュロジック**:

```typescript
interface CacheMetadata {
  [filename: string]: {
    url: string;
    lastModified?: string;  // Last-Modified ヘッダー
    etag?: string;          // ETag ヘッダー
    size: number;
    downloadedAt: string;   // ISO 8601形式
    sha256?: string;        // ファイルハッシュ（整合性確認用）
  };
}
```

**フロー**:

1. キャッシュメタデータを読み込み
2. ファイルが存在し、`lastModified` または `etag` が記録されている場合:
   - 条件付きリクエストを送信
   - `304 Not Modified`: キャッシュを使用
   - `200 OK`: 新しいファイルをダウンロード、メタデータ更新
3. ファイルが存在しない、またはメタデータがない場合:
   - 無条件でダウンロード、メタデータ作成

**エラーハンドリング**:

- ネットワークエラー: 既存キャッシュがあれば継続、なければ中断
- 404エラー: スクリプト中断、エラーメッセージ表示
- タイムアウト: リトライ（最大3回）

---

### 2. 冪等なデータファイル生成

**目的**: Git差分が意味のある変更のみを反映するようにする

**仕様**:

- 入力: `.cache/list_code.pdf`
- 出力: `data/raw/manufacturers.json`
- 冪等性: 同じPDFから常に同じJSONを生成
- 正規化: データフォーマットを統一

**データ正規化ルール**:

1. **メーカーコード**:
   - 16進数文字列（6桁、ゼロパディング）
   - プレフィックス `0x` を削除
   - 大文字に統一
   - 例: `0x00007C` → `00007C`

2. **企業名**:
   - 前後の空白をトリム
   - 全角・半角の正規化（統一ルール適用）
   - 例: `パナソニック株式会社　` → `パナソニック株式会社`

3. **ソート順**:
   - メーカーコードの昇順でソート
   - 検索・差分確認を容易にする

**出力フォーマット（`data/raw/manufacturers.json`）**:

```json
{
  "$schema": "./schema.json",
  "metadata": {
    "source": "https://echonet.jp/spec_g/list_code.pdf",
    "extractedAt": "2024-01-15T10:30:00Z",
    "sourceFileHash": "sha256:abc123...",
    "recordCount": 150
  },
  "manufacturers": [
    {
      "code": "000029",
      "nameJa": "株式会社日立製作所",
      "nameEn": null
    },
    {
      "code": "00007C",
      "nameJa": "パナソニック株式会社",
      "nameEn": "Panasonic Corporation"
    }
  ]
}
```

**冪等性の確保**:

- タイムスタンプ: `extractedAt` のみ更新（差分には含めない設計）
- ソート順: 常に一定
- フォーマット: JSON整形を統一（インデント2スペース）
- ハッシュ: ソースファイルのSHA-256を記録

**バリデーション**:

- メーカーコードの重複チェック
- 必須フィールド（code, nameJa）の存在確認
- コードフォーマットの検証（6桁16進数）

---

### 3. アプリ用形式への変換

**目的**: フロントエンドで使いやすい最適化されたデータを生成

**仕様**:

- 入力: `data/raw/manufacturers.json`
- 出力: `src/data/manufacturers.json`
- 最適化: ファイルサイズの削減
- 拡張: 検索用のメタデータ追加

**変換ルール**:

1. **メタデータの最小化**:
   - `metadata.source` と `metadata.recordCount` のみ保持
   - `extractedAt` と `sourceFileHash` は削除

2. **フィールドの最適化**:
   - `nameEn` が `null` の場合は省略
   - 冗長なフィールドを削除

3. **最終更新日の追加**:
   - `lastUpdated`: 人間が読める形式（YYYY-MM-DD）

**出力フォーマット（`src/data/manufacturers.json`）**:

```json
{
  "lastUpdated": "2024-01-15",
  "source": "https://echonet.jp/spec_g/",
  "total": 150,
  "manufacturers": [
    {
      "code": "000029",
      "nameJa": "株式会社日立製作所"
    },
    {
      "code": "00007C",
      "nameJa": "パナソニック株式会社",
      "nameEn": "Panasonic Corporation"
    }
  ]
}
```

**ファイルサイズ最適化**:

- JSON Minify（本番ビルド時）
- 不要なフィールド削除
- 目標: 50KB以下（非圧縮）

**TypeScript型定義の自動生成（オプション）**:

```typescript
// src/data/manufacturers.d.ts
export interface Manufacturer {
  code: string;
  nameJa: string;
  nameEn?: string;
}

export interface ManufacturersData {
  lastUpdated: string;
  source: string;
  total: number;
  manufacturers: Manufacturer[];
}

declare const data: ManufacturersData;
export default data;
```

---

## 実装仕様

### コマンドライン引数

```bash
./scripts/fetch-data [OPTIONS]

OPTIONS:
  --force, -f       強制的に再ダウンロード（キャッシュ無視）
  --dry-run         ダウンロードせず、既存データで変換のみ実行
  --verbose, -v     詳細なログを出力
  --help, -h        ヘルプメッセージを表示
```

### 終了コード

- `0`: 成功
- `1`: 一般的なエラー
- `2`: ネットワークエラー
- `3`: データ抽出エラー
- `4`: バリデーションエラー

### ログ出力

**標準出力（通常モード）**:

```
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

**詳細モード（--verbose）**:

```
[1/3] Downloading data from ECHONET Consortium...
  → URL: https://echonet.jp/spec_g/list_code.pdf
  → Cache file: .cache/list_code.pdf
  → Last cached: 2024-01-01T00:00:00Z
  → Sending conditional request (If-Modified-Since)
  ← 304 Not Modified
  ✓ Using cached file (123.4 KB)

[2/3] Extracting data from PDF...
  → Reading .cache/list_code.pdf
  → Detected 15 pages
  → Extracting tables...
  ✓ Found 150 manufacturer entries
  → Normalizing data...
  ✓ Validated all records
  → Writing to data/raw/manufacturers.json
  ✓ Saved (52.3 KB)

[3/3] Converting to application format...
  → Reading data/raw/manufacturers.json
  → Optimizing for application use...
  → Removed metadata fields (saved 5.1 KB)
  ✓ Generated src/data/manufacturers.json (45.2 KB)
  → Compression estimate: 12.3 KB (gzip)

✨ Done! Ready for deployment.
```

**エラー出力**:

```
[1/3] Downloading data from ECHONET Consortium...
  ✗ Failed to download list_code.pdf
  → Network error: Connection timeout
  → Retrying (1/3)...
  ✗ Failed again
  → Using cached file (may be outdated)
  ⚠️  Warning: Cache is 90 days old

[2/3] Extracting data from PDF...
  ✗ Error: Failed to parse PDF
  → The file may be corrupted

✗ Script failed. Please check the errors above.
```

---

## PDF抽出の実装選択肢

### オプション1: pdfplumber（Python推奨）

**利点**:
- 表の抽出精度が高い
- Pythonエコシステムの豊富なツール
- メンテナンスが活発

**欠点**:
- Python依存（ランタイムが必要）
- 追加の依存関係

**実装例**:

```python
import pdfplumber
import json

def extract_manufacturers(pdf_path):
    manufacturers = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table[1:]:  # ヘッダー行をスキップ
                    if row[0] and row[1]:
                        manufacturers.append({
                            "code": normalize_code(row[0]),
                            "nameJa": row[1].strip(),
                            "nameEn": row[2].strip() if len(row) > 2 and row[2] else None
                        })

    return manufacturers
```

### オプション2: pdf.js（Node.js）

**利点**:
- Node.js環境で完結
- JavaScriptのみで実装可能
- 追加インストール不要

**欠点**:
- 表の抽出が複雑
- 実装コストが高い

**実装例**:

```typescript
import * as pdfjsLib from 'pdfjs-dist';

async function extractManufacturers(pdfPath: string) {
  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdf = await loadingTask.promise;

  const manufacturers = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // テキストから表を復元（複雑）
    // ...
  }

  return manufacturers;
}
```

### オプション3: Tabula（Java CLI）

**利点**:
- 高精度な表抽出
- コマンドラインで使いやすい

**欠点**:
- Java依存
- インストールが複雑

### 推奨: pdfplumber

理由:
- 精度とメンテナンス性のバランスが良い
- Python環境は開発者にとって一般的
- テーブル抽出に特化

---

## ディレクトリ構造（詳細）

```
scripts/
├── fetch-data              # メインスクリプト（実行可能、shebang: #!/usr/bin/env bun）
├── fetch-data.ts           # TypeScript実装（bunで実行）
├── lib/
│   ├── download.ts         # ダウンロード処理
│   ├── cache.ts            # キャッシュ管理
│   ├── extract.ts          # PDF抽出ロジック
│   ├── transform.ts        # データ変換
│   ├── validate.ts         # バリデーション
│   └── logger.ts           # ログ出力
├── python/
│   └── extract_pdf.py      # PDF抽出（pdfplumber）
├── schema/
│   ├── raw.schema.json     # data/raw/ のJSONスキーマ
│   └── app.schema.json     # src/data/ のJSONスキーマ
└── README.md               # スクリプト使用方法

.cache/
├── list_code.pdf           # キャッシュされたPDF
└── cache-metadata.json     # キャッシュメタデータ

data/
└── raw/
    └── manufacturers.json  # 中間データ（Git管理）

src/
└── data/
    ├── manufacturers.json  # 最終データ（Git管理）
    └── manufacturers.d.ts  # 型定義（自動生成、オプション）
```

---

## 実装の優先順位

### Phase 1: 最小実装（MVP）

1. **基本ダウンロード**
   - 単純なHTTP GET（キャッシュなし）
   - エラーハンドリング

2. **PDF抽出**
   - pdfplumberによる表抽出
   - 基本的な正規化

3. **データ変換**
   - raw → app形式への変換
   - 基本バリデーション

### Phase 2: キャッシュ実装

1. **HTTPキャッシュ**
   - `Last-Modified` 対応
   - メタデータ管理

2. **冪等性の確保**
   - ソート順の固定
   - ハッシュ値の記録

### Phase 3: 最適化・拡張

1. **詳細ログ**
   - `--verbose` モード
   - プログレス表示

2. **並列処理**
   - 複数ファイルの同時ダウンロード

3. **CI/CD統合**
   - GitHub Actionsでの自動実行

---

## テスト

### ユニットテスト

bunのビルトインテストランナーを使用:

```typescript
// scripts/lib/__tests__/transform.test.ts
import { describe, it, expect } from 'bun:test';
import { normalizeCode, normalizeCompanyName } from '../transform';

describe('normalizeCode', () => {
  it('removes 0x prefix', () => {
    expect(normalizeCode('0x00007C')).toBe('00007C');
  });

  it('pads with zeros', () => {
    expect(normalizeCode('7C')).toBe('00007C');
  });

  it('converts to uppercase', () => {
    expect(normalizeCode('00007c')).toBe('00007C');
  });
});
```

**テスト実行**:

```bash
# 全テスト実行
bun test

# 特定のファイルのみ
bun test scripts/lib/__tests__/transform.test.ts

# watchモード
bun test --watch
```

### 統合テスト

```bash
# テストデータで実行
./scripts/fetch-data --dry-run

# 出力ファイルのバリデーション
npx ajv validate -s scripts/schema/app.schema.json -d src/data/manufacturers.json
```

---

## CI/CD統合

### GitHub Actions（自動更新）

```yaml
name: Update Manufacturer Data

on:
  schedule:
    - cron: '0 0 1 * *'  # 毎月1日
  workflow_dispatch:

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

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

      - name: Run fetch-data
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
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: update manufacturer data'
          title: 'Update ECHONET Lite manufacturer codes'
          body: |
            Automated update of manufacturer data from ECHONET Consortium.

            Please review the changes and merge if appropriate.
          branch: update-manufacturer-data
```

---

## セキュリティ考慮事項

1. **ダウンロード元の検証**
   - HTTPS必須
   - ドメイン検証（echonet.jp）

2. **ファイル整合性**
   - SHA-256ハッシュの記録
   - 改ざん検出

3. **入力バリデーション**
   - PDFファイルサイズの制限（例: 10MB）
   - 抽出データの上限（例: 10,000レコード）

4. **機密情報**
   - APIキー等は不要（公開データのみ）
   - ログに機密情報を含めない

---

## パフォーマンス目標

- **ダウンロード**: < 5秒（キャッシュヒット時: < 1秒）
- **PDF抽出**: < 10秒
- **データ変換**: < 1秒
- **合計実行時間**: < 20秒（初回）、< 2秒（キャッシュヒット）

---

## トラブルシューティング

### PDFフォーマットが変更された場合

- エラーメッセージで通知
- 手動での対応が必要
- スクリプトを更新

### ネットワークエラー

- 自動リトライ（3回）
- キャッシュがあれば継続
- エラーログに詳細を出力

### データ不整合

- バリデーションエラーで中断
- 詳細なエラーメッセージ
- 問題のあるレコードを特定
