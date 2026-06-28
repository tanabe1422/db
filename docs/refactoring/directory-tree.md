# TreeNode と FolderRow の DirectoryTree 共通化

- Phase: 3
- BACKLOG: H2
- 状態: 実装済み

## 現状

サイドバーと diff セットアップで、ほぼ同型のディレクトリツリー UI が二重実装されている。

**`frontend/src/components/sidebar/TreeNode.tsx`（74行）**

- `useState(depth < 2)` で初期展開
- ディレクトリ: Chevron + Folder + 再帰
- ファイル: File アイコン + クリックで選択
- インデント: `depth * 16 + 12` px

**`frontend/src/components/diff/DiffSetupPanel.tsx` の `FolderRow`（L20–95）**

- 同じ `useState(depth < 2)` パターン
- ディレクトリのみ表示（`childDirs` フィルタ）
- 行末に左右割当ボタン（`DiffSideMark`）
- インデント: `depth * 14 + 8` px
- `styles.row` で expand ボタンと assign を横並び

## 課題と修正理由

- **二重メンテ**: 展開ロジック・Chevron 表示を変更するたびに2箇所修正が必要。
- **将来の拡張**: ツリー行のキーボード操作や a11y 改善が2系統に及ぶ。
- **BACKLOG H2**: 明示的な残課題。

## 修正方針

**新規:**

- `frontend/src/hooks/useTreeExpansion.ts` — `useState(depth < threshold)` を共通化（default threshold=2）
- `frontend/src/components/tree/DirectoryTreeBranch.tsx` — ディレクトリ行の再帰コンポーネント
  - props: `node`, `depth`, `paddingLeft`, `styles`（呼び出し側の CSS Module）, `buttonClassName`, `childFilter`, `renderTrailing`, `renderChild`

**変更:**

- `TreeNode.tsx` — ファイル行はそのまま、ディレクトリ行を `DirectoryTreeBranch` 利用
- `DiffSetupPanel.tsx` — `FolderRow` を `DirectoryTreeBranch` + 割当ボタン trailing に置換

**設計判断:**

- CSS Module は各 View が異なるため、styles を props で渡す（共通化はロジック・構造のみ）
- インデント px は呼び出し側が計算して `paddingLeft` として渡す

**やらないこと:**

- `DirectoryPanel` と `DiffSetupPanel` の panel CSS 共通化
- ファイル行の共通化（構造が異なるため TreeNode 内に残す）

## 変更ファイル一覧

| before | after |
|--------|-------|
| `TreeNode.tsx`（dir 部分） | `DirectoryTreeBranch.tsx` + `useTreeExpansion.ts` |
| `DiffSetupPanel.tsx`（FolderRow） | `DirectoryTreeBranch` 利用 |

## 検証

```powershell
cd frontend
pnpm build
pnpm test
```

手動: サイドバーでフォルダ展開・ファイル選択、diff モードでフォルダ割当。

## 実施結果（実装後に追記）

- `useTreeExpansion.ts` を新規作成
- `DirectoryTreeBranch.tsx` を新規作成（styles を props で受け取り CSS Module 差を吸収）
- `TreeNode.tsx` のディレクトリ行を `DirectoryTreeBranch` 利用に変更
- `DiffSetupPanel.tsx` の `FolderRow` を `DiffFolderRow` + `DirectoryTreeBranch` に置換
