# データ収集フローチャート

## 概要図

```mermaid
flowchart TD
    Start([開始: ./scripts/fetch-data]) --> CheckCache{キャッシュ確認}

    CheckCache -->|キャッシュあり| UseCache[キャッシュ使用]
    CheckCache -->|キャッシュなし/--force| Download[XLSXダウンロード]

    Download --> SaveXLSX[.cache/list_code.xlsx]
    UseCache --> SaveXLSX

    SaveXLSX --> ExtractXLSX[TypeScript + xlsx<br/>でXLSX抽出]

    ExtractXLSX --> ExtractedJSON[.cache/extracted.json<br/>235 manufacturers]

    ExtractedJSON --> Transform1[Raw Data変換<br/>メタデータ追加]

    Transform1 --> RawJSON[data/raw/manufacturers.json<br/>- source URL<br/>- extractedAt<br/>- sourceFileHash<br/>- recordCount]

    RawJSON --> Transform2[App Data変換<br/>- lastUpdated<br/>- total<br/>- manufacturers array]

    Transform2 --> AppJSON[src/data/manufacturers.json<br/>25.0 KB<br/>アプリケーション用]

    AppJSON --> Complete([完了])

    style Start fill:#e1f5e1
    style Complete fill:#e1f5e1
    style SaveXLSX fill:#fff4e6
    style ExtractedJSON fill:#fff4e6
    style RawJSON fill:#e3f2fd
    style AppJSON fill:#f3e5f5
```

## 詳細フロー

### 1. ダウンロードフェーズ

```mermaid
flowchart LR
    A[ECHONET Consortium] -->|HTTPS| B[XLSX URL]
    B --> C{キャッシュチェック}
    C -->|SHA256一致| D[キャッシュヒット]
    C -->|不一致/なし| E[ダウンロード]
    E --> F[.cache/list_code.xlsx<br/>24 KB]
    D --> F
```

**URL**: `https://echonet.jp/wp/wp-content/uploads/pdf/General/Echonet/ManufacturerCode/list_code.xlsx`

### 2. 抽出フェーズ

```mermaid
flowchart TD
    XLSX[list_code.xlsx] --> XLSXLib[xlsx library]
    XLSXLib --> Sheet[シート取得]
    Sheet --> Rows[行データ抽出]
    Rows --> Skip[ヘッダー行スキップ<br/>Row 0-3]
    Skip --> Parse[データパース<br/>Row 4以降]
    Parse --> Structure{データ構造化}
    Structure --> Code[code: 6桁Hex]
    Structure --> NameJa[nameJa: 日本語名]
    Structure --> NameEn[nameEn: 英語名/退会情報]
    Code --> JSON[extracted.json]
    NameJa --> JSON
    NameEn --> JSON
```

**カラム構造**: `[コード, 会社名, 備考]`

### 3. 変換フェーズ

```mermaid
flowchart LR
    subgraph Input
        E[extracted.json<br/>235 items]
    end

    subgraph Transform1[Raw Data変換]
        M[メタデータ追加]
        M --> S[source URL]
        M --> T[extractedAt timestamp]
        M --> H[sourceFileHash SHA256]
        M --> C[recordCount]
    end

    subgraph Output1
        R[data/raw/<br/>manufacturers.json]
    end

    subgraph Transform2[App Data変換]
        V[バリデーション]
        V --> L[lastUpdated]
        V --> TO[total]
        V --> MA[manufacturers array]
    end

    subgraph Output2
        A[src/data/<br/>manufacturers.json<br/>25.0 KB]
    end

    E --> Transform1 --> Output1
    Output1 --> Transform2 --> Output2
```

## データ構造

### extracted.json
```json
[
  {
    "code": "000005",
    "nameJa": "シャープ株式会社",
    "nameEn": null
  }
]
```

### data/raw/manufacturers.json
```json
{
  "metadata": {
    "source": "https://...",
    "extractedAt": "2026-01-11T02:46:30.571Z",
    "sourceFileHash": "2b4a55f298...",
    "recordCount": 235
  },
  "manufacturers": [...]
}
```

### src/data/manufacturers.json
```json
{
  "lastUpdated": "2026-01-11",
  "source": "https://...",
  "total": 235,
  "manufacturers": [...]
}
```

## 実行コマンド

### 基本実行
```bash
./scripts/fetch-data
```

### オプション付き実行
```bash
# 強制再ダウンロード
./scripts/fetch-data --force

# 詳細ログ
./scripts/fetch-data --verbose

# ドライラン（ダウンロードスキップ）
./scripts/fetch-data --dry-run
```

## 依存関係

```mermaid
graph TD
    FD[fetch-data.ts] --> DL[lib/download.ts]
    FD --> TR[lib/transform.ts]
    FD --> XL[lib/extract-xlsx.ts]

    DL --> Cache[キャッシュ管理]
    DL --> SHA[SHA256計算]

    TR --> Raw[Raw Data変換]
    TR --> App[App Data変換]

    XL --> XLSX[xlsx library]
```

## エラーハンドリング

```mermaid
flowchart TD
    Start --> Download
    Download --> |失敗| E1[エラー: ダウンロード失敗]
    Download --> |成功| Extract
    Extract --> |XLSX不正| E2[エラー: XLSX解析失敗]
    Extract --> |成功| Transform
    Transform --> |検証失敗| E3[エラー: データ不正]
    Transform --> |成功| Success[完了]

    E1 --> Exit[終了 code 1]
    E2 --> Exit
    E3 --> Exit
    Success --> Exit2[終了 code 0]

    style Success fill:#c8e6c9
    style E1 fill:#ffcdd2
    style E2 fill:#ffcdd2
    style E3 fill:#ffcdd2
```

## パフォーマンス

| フェーズ | 時間 | 備考 |
|---------|------|------|
| ダウンロード | ~0.5秒 | 24 KB |
| XLSX抽出 | ~0.3秒 | xlsx library処理 |
| 変換 | <0.1秒 | JSON処理 |
| **合計** | **~1秒** | 初回実行 |
| キャッシュヒット時 | ~0.4秒 | ダウンロードスキップ |
