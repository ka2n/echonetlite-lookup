# Scripts Documentation

## fetch-data

統合データ取得スクリプト。ECHONET Liteのメーカーコード一覧を自動的にダウンロード、抽出、変換します。

### 使用方法

```bash
# 基本実行（初回はダウンロード、2回目以降はキャッシュを利用）
./scripts/fetch-data

# または npm scripts経由
bun run fetch-data
```

### オプション

- `--force, -f`: キャッシュを無視して強制的に再ダウンロード
- `--dry-run`: ダウンロードをスキップし、既存のキャッシュデータのみを処理
- `--verbose, -v`: 詳細なログを出力
- `--help, -h`: ヘルプメッセージを表示

### 例

```bash
# 強制的に再ダウンロード
./scripts/fetch-data --force

# 詳細ログ付きで実行
./scripts/fetch-data --verbose

# 既存データの変換のみ
./scripts/fetch-data --dry-run
```

### 動作

1. **データダウンロード**: ECHONET ConsortiumからPDFをダウンロード
   - HTTPキャッシュ対応（If-Modified-Since, ETag）
   - 304 Not Modifiedの場合はキャッシュを使用
   - ネットワークエラー時は自動リトライ（最大3回）

2. **PDF抽出**: Pythonの pdfplumber を使用して表データを抽出
   - 中間JSONファイルを`.cache/extracted.json`に保存

3. **データ変換**:
   - 生データを`data/raw/manufacturers.json`に保存（正規化済み）
   - アプリ用データを`src/data/manufacturers.json`に保存（最適化済み）

### 必要な環境

- **bun**: JavaScript/TypeScriptランタイム（aquaで管理）
- **Python 3**: PDFデータ抽出用
- **pdfplumber**: Python PDFライブラリ

```bash
# pdfplumberのインストール
pip install pdfplumber
```

### トラブルシューティング

#### PDFダウンロード失敗

```
✗ Download failed: File not found (404)
```

→ URLが変更されている可能性があります。`scripts/fetch-data.ts`の`PDF_URL`を確認してください。

#### PDF抽出エラー

```
✗ Error: PDF extraction failed
```

→ PDFフォーマットが変更された可能性があります。`scripts/python/extract_pdf.py`を更新してください。

#### pdfplumberが見つからない

```
Error: pdfplumber is not installed
```

→ `pip install pdfplumber`でインストールしてください。

## ディレクトリ構造

```
scripts/
├── fetch-data           # メインスクリプト（シェルラッパー）
├── fetch-data.ts        # メイン実装（TypeScript）
├── lib/                 # ライブラリモジュール
│   ├── cache.ts         # キャッシュ管理
│   ├── download.ts      # ダウンロード処理
│   ├── transform.ts     # データ変換
│   └── tests/           # テスト
└── python/
    └── extract_pdf.py   # PDF抽出スクリプト
```

## 開発

### テスト実行

```bash
# 全テスト実行
bun test

# 特定のテストファイルのみ
bun test scripts/lib/tests/cache.test.ts
```

### 新しいデータソースの追加

`scripts/fetch-data.ts`を編集:

```typescript
const SOURCES = [
  { url: 'https://...', filename: 'new_data.pdf', extractor: 'extractNewData' },
  // ...
];
```

対応する抽出関数を`scripts/lib/extract.ts`に追加します。
