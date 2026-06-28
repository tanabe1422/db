# ツリー走査ロジックの utils 切り出し

- Phase: 1
- BACKLOG: M4/M5（useFolderDiff 周辺）
- 状態: 実装済み

## 現状

`frontend/src/hooks/useFolderDiff.ts` L34–44 に `collectFiles(node, prefix)` が private 関数として定義されている。

```typescript
function collectFiles(node: TreeNode, prefix = ''): LeafFile[] {
  const files: LeafFile[] = []
  for (const child of node.children) {
    if (child.isDir) {
      files.push(...collectFiles(child, `${prefix}${child.name}/`))
    } else {
      files.push({ relPath: `${prefix}${child.name}`, fullPath: child.path })
    }
  }
  return files
}
```

hook 内の `run`（L151–197）で左右フォルダのファイル一覧を `Map<relPath, fullPath>` に変換するために使われている。React の状態管理・async 読込・キャンセルトークンと、ツリー走査という純粋なデータ変換が同一ファイルに混在している。

## 課題と修正理由

- **テスト困難**: hook 内の private 関数は単体テストできない。フォルダ比較の入力（relPath 列挙）が正しいかは重要なビジネスロジック。
- **責務の混在**: `useFolderDiff` は async オーケストレーションに専念すべき。ツリー走査は React に依存しない。
- **再利用性**: Phase 3 のツリー共通化や将来のファイル一覧機能でも同じ走査が必要になる可能性がある。

## 修正方針

**新規:** `frontend/src/utils/treeFiles.ts`

- `LeafFile` 型と `collectFiles(node, prefix?)` を export
- 挙動は現状と同一（再帰的に子を走査、ディレクトリは `name/` を prefix に追加）

**変更:** `useFolderDiff.ts`

- `collectFiles` を削除し `treeFiles` から import

**新規テスト:** `frontend/src/utils/treeFiles.test.ts`

- ネストした TreeNode フィクスチャで relPath / fullPath が期待通りか検証

**やらないこと**

- `countEntries` の移動（hook の export として残す）
- `childDirs` フィルタの共通化（Phase 3 で検討）

## 変更ファイル一覧

| before | after |
|--------|-------|
| `useFolderDiff.ts`（collectFiles 内蔵） | `treeFiles.ts`（新規）+ `useFolderDiff.ts`（import のみ） |
| — | `treeFiles.test.ts`（新規） |

## 検証

```powershell
cd frontend
pnpm test -- treeFiles
pnpm lint
```

## 実施結果（実装後に追記）

- `frontend/src/utils/treeFiles.ts` に `LeafFile` と `collectFiles` を移動
- `frontend/src/utils/treeFiles.test.ts` を追加（3 テスト）
- `useFolderDiff.ts` から private 関数を削除し import に変更
