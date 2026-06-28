# App.tsx インラインコンポーネントの分離

- Phase: 2
- BACKLOG: H1（App.tsx 責務分割の第一段階）
- 状態: 実装済み

## 現状

`frontend/src/App.tsx`（310行）に以下がインライン定義されている。

- `TableDefinitionPanel`（L18–56）: `useTableDefinition` で読込し `TableDefinitionView` を表示
- `diffLabel`（L58–60）: ツリーノードの表示ラベル
- `DiffWorkspace`（L62–106）: フォルダ比較のメイン領域（`useFolderDiff` + `FolderDiffView` / `FileDiffView` 切替）

`App` 本体はタブ状態・dirty 管理・edit/diff モード・レイアウト配線をすべて担当している。

## 課題と修正理由

- **責務集中**: 編集ワークスペースと diff ワークスペースの UI が App に直書きされ、変更時の影響範囲が大きい。
- **テスト・Storybook**: インラインコンポーネントは単体で import しづらい。
- **H1 の第一段階**: hook 抽出の前に、まずファイル分離だけで App を薄くする。

## 修正方針

**新規:**

- `frontend/src/components/workspace/TableDefinitionPanel.tsx` — 現 `TableDefinitionPanel` を移動
- `frontend/src/components/diff/DiffWorkspace.tsx` — 現 `DiffWorkspace` + `diffLabel` を移動

**変更:**

- `App.tsx` — 上記を import し、レイアウト配線と状態管理のみ残す

**やらないこと（本タスク）:**

- タブ/dirty の hook 化（`tab-workspace-hook.md` で実施）
- diff モード状態の hook 化

## 変更ファイル一覧

| before | after |
|--------|-------|
| `App.tsx`（TableDefinitionPanel, DiffWorkspace 内蔵） | `TableDefinitionPanel.tsx`, `DiffWorkspace.tsx`（新規） |
| `App.tsx` | import のみに簡略化 |

## 検証

```powershell
cd frontend
pnpm build
pnpm test
```

手動: ファイル選択 → 編集、diff モード → フォルダ比較 → ファイル diff。

## 実施結果（実装後に追記）

- `TableDefinitionPanel.tsx` を `components/workspace/` に移動
- `DiffWorkspace.tsx` を `components/diff/` に移動（`diffLabel` 含む）
- `App.tsx` は 175 行に縮小
