# db-gui バックログ

メンテナンス性改善（重複解消・TableEditorGrid 分割・Storybook 拡充・Button 共通化・カラートークン化）完了後の残課題一覧。

最終更新: 2026-06-28

---

## 完了済み（参考）

| 項目 | 内容 |
|------|------|
| 重複解消 | `gridColumns.ts` / `cx.ts` / `isDecimal` / `META_FIELDS` 共通化 |
| 肥大化分割 | `TableDefinitionView` → hook + サブコンポーネント 7 ファイル |
| Storybook | 9 コンポーネントに story（Diff 系・Table・Tab・Confirm 等） |
| Button 共通化 | `Button` / `IconButton` 新設、主要ツールバー類を置換 |
| デザイントークン | `:root` にパレット CSS 変数、全 CSS Module を `var()` 化 |

---

## 残課題一覧

### 難易度の目安

| 記号 | 意味 |
|------|------|
| ★ | 小さく明確。1ファイル〜数ファイル、仕様が固定 |
| ★★ | 複数ファイル、軽い設計判断あり |
| ★★★ | 横断的リファクタ、テスト・挙動の担保が必要 |
| ★★★★ | アーキテクチャ判断、性能・UX・E2E など探索が必要 |

### おすすめ AI（Cursor）

| モデル | 向いている作業 |
|--------|----------------|
| **Haiku** | 定型的な追加・置換・story 1本・lint 修正。指示が具体的な単発タスク |
| **Composer 2** | 中規模の実装・リファクタのデフォルト。複数ファイルを一気に直す |
| **Sonnet** | 状態管理の整理、テスト設計、セマンティックトークン設計など判断が要る作業 |
| **Opus** | 大規模分割、性能改善、テーマシステム、E2E 戦略など探索・設計が主役の作業 |

---

## ★ 易（Haiku または Composer 2）

| # | 課題 | 詳細 | 推奨 AI |
|---|------|------|---------|
| E1 | `Button.stories.tsx` 未作成 | primary / ghost / danger、IconButton md/sm の一覧 story | **Haiku** |
| E2 | `DiffSetupPanel.stories.tsx` 未作成 | フォルダ選択 UI、左右割当状態の story | **Haiku** |
| E3 | `DiffSideMark` fast-refresh 警告 | `diffSideAriaLabel` を別ファイルへ分離（oxlint 警告解消） | **Haiku** |
| E4 | `DirectoryPanel.tsx` 体裁 | 行間の空行が多く読みにくい。フォーマット統一 | **Haiku** |
| E5 | 戻るボタンの Button 化 | `FileDiffView` / `DiffSetupPanel` の `backBtn` を `Button variant="ghost"` に | **Composer 2** |
| E6 | Storybook 状態の追加 | `TableDefinitionView` の検証エラー表示、`FolderDiffView` の「変更なし表示 ON」等 | **Haiku** |
| E7 | README に開発ドキュメントリンク | `docs/BACKLOG.md`、Storybook 起動方法の補足（任意） | **Haiku** |

---

## ★★ 中（Composer 2 または Sonnet）

| # | 課題 | 詳細 | 推奨 AI |
|---|------|------|---------|
| M1 | 残り `<button>` の共通化 | `TreeNode` / `TabBar` 閉じる / `FolderDiffView` 行 / `DiffSetupPanel` 割当 / `SettingsDialog` ディレクトリ選択 など | **Composer 2** |
| M2 | セマンティックトークン | `--color-blue-600` → `--color-primary` 等、用途ベースの変数層を追加 | **Sonnet** |
| M3 | `useGridNavigation` のテスト | キーボード操作・Tab 移動・Enter 編集。jsdom + userEvent | **Composer 2** |
| M4 | diff 系コンポーネントのテスト | `FolderDiffView` フィルタ、`FileDiffView` ハイライト（RTL） | **Composer 2** |
| M5 | `useFolderDiff` の deps 整理 | `eslint-disable` を外し、依存配列を正しく設計 | **Composer 2** |
| M6 | GitHub Actions CI | `pnpm test` / `pnpm build` / `go test ./...` / `build-storybook`（任意） | **Composer 2** |
| M7 | Storybook Interaction tests | 保存ボタン disabled、diff 行クリック等の `play` 関数 | **Composer 2** |
| M8 | `MainLayout` / `TreeNode` の story | サイドバー単体の見た目確認 | **Haiku** |

---

## ★★★ 難（Sonnet または Opus）

| # | 課題 | 詳細 | 推奨 AI |
|---|------|------|---------|
| H1 | `App.tsx` の責務分割 | タブ状態・diff モード・dirty 管理を `useWorkspace` 等に抽出（~280 行） | **Sonnet** |
| H2 | フォルダツリーの重複 | `DiffSetupPanel` の `FolderRow` と `TreeNode` の共通化 | **Sonnet** |
| H3 | 編集グリッドのアクセシビリティ | グリッドの roving tabindex、スクリーンリーダー向けラベル | **Sonnet** |
| H4 | 大規模 diff の性能 | フォルダ内ファイル数が多いときの並列読込上限・進捗表示・キャンセル | **Opus** |
| H5 | Go フロント連携のテスト | `internal/app` と Wails バインディングの結合テスト方針 | **Sonnet** |
| H6 | `serializeTable` / Go `tabledef` の対称性 | TS と Go でバリデーション・シリアライズ仕様がズレないかの整理 | **Sonnet** |

---

## ★★★★ 高難度（Opus 推奨）

| # | 課題 | 詳細 | 推奨 AI |
|---|------|------|---------|
| X1 | ダークモード / テーマ切替 | セマンティックトークン + `prefers-color-scheme` または設定 UI | **Opus** |
| X2 | E2E テスト戦略 | Wails デスクトップ vs ブラウザ-only、`wails dev` 前提の自動化 | **Opus** |
| X3 | 仮想スクロール | カラム数・行数が多いテーブル編集の DOM 負荷対策 | **Opus** |
| X4 | 差分マージ / 3-way diff | 現状は閲覧のみ。編集・マージは別機能として設計が必要 | **Opus** |

---

## 優先度のおすすめ順

実装コスト対効果が高い順:

1. **E1–E3, M1** — UI 一貫性と Storybook 完成度（Composer 2 / Haiku）
2. **M3–M4, M6** — リグレッション防止（Composer 2）
3. **M2** — テーマ拡張の土台（Sonnet）
4. **H1–H2** — 次の大きなリファクタ前に（Sonnet）
5. **H4, X1–X2** — ユーザー体験・品質の上限を上げる段階（Opus）

---

## Storybook カバレッジ（現状）

| コンポーネント | story | 備考 |
|----------------|-------|------|
| App | ✅ | |
| DirectoryPanel | ✅ | |
| SettingsDialog | ✅ | |
| DiffSideMark | ✅ | |
| FolderDiffView | ✅ | |
| FileDiffView | ✅ | |
| TableDefinitionView | ✅ | |
| TabBar | ✅ | |
| ConfirmDialog | ✅ | |
| **Button** | ❌ | E1 |
| **DiffSetupPanel** | ❌ | E2 |
| MainLayout | ❌ | M8 |
| TreeNode | ❌ | M8 |
| EditableCell / CheckCell 等 | ❌ | 親 story で間接確認のみ |

---

## テストカバレッジ（現状）

| 対象 | テスト | 備考 |
|------|--------|------|
| `diffTable` | ✅ | |
| `validateTable` | ✅ | |
| `relPathSort` | ✅ | |
| `TableDefinitionView` | ✅ | クリック・キーボード・保存 |
| `useGridNavigation` | ❌ | M3 |
| `useFolderDiff` | ❌ | M4/M5 |
| `FolderDiffView` / `FileDiffView` | ❌ | M4 |
| Go `internal/*` | 一部 | `validate_test`, `scanner_test`, `config_test` |

---

## CI / 運用

| 項目 | 状態 |
|------|------|
| GitHub Actions | ❌ 未設定（M6） |
| pre-commit hook | 未確認 |
| Dependabot / Renovate | 未設定 |

---

## メモ

- **「まだまだ課題ある？」** → 致命的な負債はかなり減った。残りは **仕上げ（story・Button 統一・テスト・CI）** と **将来拡張（テーマ・性能・E2E）** に分かれる。
- 小さく進めるなら **E1 → E5 → M1 → M3** の順がおすすめ。
- 1 セッションでまとめてやるなら **Composer 2** に M1+M3+M6 を渡す。設計から相談するなら **Sonnet（H1/H2）**、**Opus（X1/X4）**。
