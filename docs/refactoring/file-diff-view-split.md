# FileDiffView のサブコンポーネント分割

- Phase: 1
- 状態: 実装済み

## 現状

`frontend/src/components/diff/FileDiffView.tsx`（236行）に以下が同居している。

| 責務 | 行 | 内容 |
|------|-----|------|
| 列定義 | L17–47 | `DISPLAY_COLS`（→ diffDisplayColumns へ移動予定） |
| メタパネル | L55–80 | `MetaPanel` |
| セル描画 | L82–127 | `renderSideCells` |
| テーブル | L129–182 | `SideTable` |
| スクロール同期 | L185–205 | ref + ハンドラ（→ hook へ移動予定） |
| レイアウト | L207–234 | ヘッダー + 左右ペイン配置 |

1 ファイルに UI レイアウト・テーブル描画・差分ハイライト・メタ情報が混在し、変更時の影響範囲が読みにくい。

## 課題と修正理由

- **単一責任の違反**: ファイル diff 画面の「骨格」と「部品」が分離されていない。
- **TableDefinitionView との非対称**: 編集グリッドは hook + サブコンポーネント分割済みだが、diff 表示は未分割。
- **Storybook / テスト**: 部品単位の確認がしづらい（現状は FileDiffView 全体のみ）。

## 修正方針

**新規（`frontend/src/components/diff/` 配下）:**

| ファイル | 移す内容 |
|---------|---------|
| `DiffMetaPanel.tsx` | 現 `MetaPanel` + `metaByField` |
| `DiffSideCells.tsx` | セル描画（`renderSideCells` をコンポーネント化） |
| `DiffSideTable.tsx` | 現 `SideTable` |

**残す `FileDiffView.tsx`:**

- ヘッダー（戻るボタン + ファイル名）
- 左右ペイン配置
- `useSyncedHorizontalScroll` の利用
- 目標 ~50 行

**依存関係:**

```
FileDiffView
├── DiffMetaPanel
└── DiffSideTable
    └── DiffSideCells
```

**やらないこと**

- CSS Module の分割（`FileDiffView.module.css` を共有のまま import）
- 戻るボタンの Button 化（BACKLOG E5、今回対象外）

## 変更ファイル一覧

| before | after |
|--------|-------|
| `FileDiffView.tsx`（236行） | `FileDiffView.tsx`（~50行） |
| — | `DiffMetaPanel.tsx`（新規） |
| — | `DiffSideCells.tsx`（新規） |
| — | `DiffSideTable.tsx`（新規） |

`FileDiffView.stories.tsx` は import パス変更のみ。

## 検証

```powershell
cd frontend
pnpm build
pnpm storybook  # FileDiffView story
```

手動: フォルダ比較 → ファイル diff → メタ・テーブル・ハイライト・戻る。

## 実施結果（実装後に追記）

- `DiffMetaPanel.tsx` / `DiffSideCells.tsx` / `DiffSideTable.tsx` を新規作成
- `FileDiffView.tsx` は 58 行に縮小（ヘッダー + ペイン配置のみ）
