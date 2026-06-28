# タブ/dirty 状態の hook 化

- Phase: 2
- BACKLOG: H1（App.tsx 責務分割の第二段階）
- 状態: 実装済み

## 現状

`frontend/src/App.tsx` L109–182 にタブワークスペースの状態とハンドラが集中している。

| 状態 | 用途 |
|------|------|
| `openPaths` | 開いているタブのパス一覧 |
| `activePath` | アクティブタブ |
| `dirtyPaths` | 未保存のタブ |
| `closingPath` | 閉じ確認ダイアログ対象 |

| ハンドラ | 用途 |
|---------|------|
| `handleSelectFile` | サイドバーからファイルを開く |
| `updateDirty` | 編集の dirty 通知 |
| `closeTab` | タブを閉じる |
| `handleRequestClose` | dirty 時は確認ダイアログ |
| `handleConfirmClose` | 確認後に閉じる |
| `resetTabs` | アクティブディレクトリ変更時にリセット |

`ConfirmDialog` の open 状態は `closingPath !== null` で制御。

## 課題と修正理由

- **App の肥大化**: タブ管理は編集モード固有の関心事だが App 直下に散在。
- **テスト容易性**: タブ閉じロジック（activePath の次タブ選択 L157–159）は hook 単体でテスト可能。
- **H1 完了に向けた分離**: コンポーネント分離後、状態ロジックも hook へ。

## 修正方針

**新規:** `frontend/src/hooks/useTabWorkspace.ts`

```typescript
export function useTabWorkspace() {
  // state + handlers
  return {
    openPaths,
    activePath,
    dirtyPaths,
    closingPath,
    handleSelectFile,
    updateDirty,
    handleRequestClose,
    handleConfirmClose,
    handleCancelClose, // setClosingPath(null)
    resetTabs,
  }
}
```

**変更:** `App.tsx`

- タブ関連 state/handlers を削除し hook を利用
- `handleSetActive` 内の `resetTabs()` は hook から取得

**やらないこと:**

- diff モード（`mode`, `leftNode`, `rightNode`）の hook 化 — 別タスクで `useDiffMode` 検討

## 変更ファイル一覧

| before | after |
|--------|-------|
| `App.tsx`（タブ state 内蔵） | `useTabWorkspace.ts`（新規）+ `App.tsx`（hook 利用） |

## 検証

```powershell
cd frontend
pnpm build
pnpm test
```

手動: タブ複数開く、dirty タブ閉じる（確認ダイアログ）、ディレクトリ切替でタブリセット。

## 実施結果（実装後に追記）

- `frontend/src/hooks/useTabWorkspace.ts` を新規作成
- タブ/dirty/閉じ確認の state と handlers を App から移動
- `handleCancelClose` を追加（`onCancel` 用）
