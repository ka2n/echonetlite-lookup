# Contributing Guide

このプロジェクトへの貢献を歓迎します！

## 開発の流れ

### 1. 環境構築

```bash
# リポジトリのクローン
git clone <repository-url>
cd echonetlite-lookup

# ツールのインストール
aqua install

# 依存関係のインストール
bun install

# Python依存関係（PDF抽出用）
pip install pdfplumber
```

### 2. ブランチ作成

```bash
# mainブランチから新しいブランチを作成
git checkout -b feature/your-feature-name
# または
git checkout -b fix/your-bug-fix
```

### 3. 開発

#### TDD（テスト駆動開発）の実践

このプロジェクトはTDDで開発されています:

1. **テストを先に書く**
   ```bash
   # 新しいテストファイルを作成
   touch src/lib/new-feature.test.ts
   ```

2. **失敗するテストを確認**
   ```bash
   bun test src/lib/new-feature.test.ts
   ```

3. **最小限の実装**
   ```bash
   # 機能を実装
   touch src/lib/new-feature.ts
   ```

4. **テストを通す**
   ```bash
   bun test src/lib/new-feature.test.ts
   ```

5. **リファクタリング**
   - コードを整理
   - 重複を削除
   - 可読性を向上

#### コーディング規約

- **TypeScript**: 厳格モード（`strict: true`）
- **フォーマット**: プロジェクトのTSConfig設定に従う
- **命名**:
  - ファイル: kebab-case（例: `search-bar.tsx`）
  - コンポーネント: PascalCase（例: `SearchBar`）
  - 関数/変数: camelCase（例: `searchManufacturers`）
  - 定数: UPPER_SNAKE_CASE（例: `PDF_URL`）
- **インポート**: 相対パス（`@/`エイリアスを使用）

### 4. テスト

```bash
# 全テスト実行
bun test

# 特定のテストファイル
bun test src/lib/search.test.ts

# watchモード
bun test --watch
```

### 5. コミット

コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に従ってください:

```bash
# 機能追加
git commit -m "feat: add fuzzy search functionality"

# バグ修正
git commit -m "fix: resolve cache invalidation issue"

# リファクタリング
git commit -m "refactor: simplify download module"

# テスト追加
git commit -m "test: add tests for cache manager"

# ドキュメント更新
git commit -m "docs: update API documentation"
```

**コミットメッセージの例**:

```
feat: add fuzzy search functionality

- Integrate Fuse.js for fuzzy matching
- Update search tests
- Add configuration for search threshold

Closes #123
```

### 6. プルリクエスト

1. **テストが全て通ることを確認**
   ```bash
   bun test
   ```

2. **ビルドが成功することを確認**
   ```bash
   bun run build
   ```

3. **変更をプッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **プルリクエストを作成**
   - 変更内容の説明を記載
   - 関連するIssueをリンク
   - スクリーンショット（UI変更の場合）

## プルリクエストのガイドライン

### チェックリスト

- [ ] テストが全て通る
- [ ] 新機能にはテストが追加されている
- [ ] ドキュメントが更新されている（必要な場合）
- [ ] コードに不要なコメントやデバッグコードが残っていない
- [ ] 型定義が適切に設定されている
- [ ] レスポンシブデザインに対応している（UI変更の場合）

### レビュープロセス

1. 自動テストが実行されます（GitHub Actions）
2. コードレビューが行われます
3. 必要に応じて修正を行います
4. 承認後、mainブランチにマージされます

## ファイル構成

### 新しいコンポーネントの追加

```typescript
// src/components/NewComponent.tsx
import type { ReactNode } from 'react';

interface NewComponentProps {
  title: string;
  children?: ReactNode;
}

export function NewComponent({ title, children }: NewComponentProps) {
  return (
    <div className="new-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

対応するテスト:

```typescript
// src/components/NewComponent.test.tsx
import { describe, it, expect } from 'bun:test';
import { NewComponent } from './NewComponent';

describe('NewComponent', () => {
  it('should render title', () => {
    // テストを実装
  });
});
```

### 新しいルートの追加

1. ルートファイルを作成: `src/routes/new-page.tsx`
2. `src/router.tsx` にルートを追加
3. ナビゲーションを更新: `src/routes/__root.tsx`

## デバッグ

### ローカル開発

```bash
# 開発サーバーを起動
bun run dev

# 詳細ログ付きでデータ取得
./scripts/fetch-data --verbose
```

### テストのデバッグ

```typescript
// テスト内でconsole.logを使用
it('should debug this test', () => {
  const result = searchManufacturers({ query: 'test', type: 'name' });
  console.log('Result:', result);
  expect(result).toHaveLength(1);
});
```

## リリースプロセス

（メンテナー向け）

1. バージョン更新: `package.json`
2. CHANGELOG更新
3. タグ作成: `git tag v1.0.0`
4. プッシュ: `git push origin v1.0.0`
5. デプロイ: `wrangler deploy`

## 質問・サポート

- GitHub Issues: バグ報告、機能要望
- Discussions: 一般的な質問、アイデア

## ライセンス

このプロジェクトは MIT License の下でライセンスされています。
貢献することで、あなたの変更も同じライセンスの下で公開されることに同意したものとみなされます。
