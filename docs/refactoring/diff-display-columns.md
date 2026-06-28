# 差分列定義とハイライト判定の lib 集約

- Phase: 1
- BACKLOG: H6 関連（列定義の単一情報源）
- 状態: 実装済み

## 現状

`frontend/src/lib/gridColumns.ts` L24 のコメント:

> 編集グリッド(NAV_COLS)・差分表示(DISPLAY_COLS)・比較(COMPARE_COLS)はすべてこれから導出する。

編集グリッド側は `frontend/src/components/table/navColumns.ts` で `GRID_COLUMNS.map(...)` により `NAV_COLS` を導出済み。

一方、差分表示の `DISPLAY_COLS` は `frontend/src/components/diff/FileDiffView.tsx` L26–47 に閉じ込められている。さらにセルハイライト判定（L88–98）も同ファイル内の `renderSideCells` に直書きされている。

```typescript
const highlightChanged = row.status === 'changed' && row.changed.has(col.id)
const highlightAdded = row.status === 'added' && side === 'right'
const highlightRemoved = row.status === 'removed' && side === 'left'
```

`DISPLAY_COLS` は CSS Module クラス（`styles.center` 等）を `cls` プロパティに含んでおり、lib 層と UI 層が混在している。

## 課題と修正理由

- **コメントと実装の乖離**: `gridColumns.ts` が単一情報源と宣言しているが、DISPLAY_COLS だけコンポーネント内。
- **navColumns との非対称**: 同型パターン（GRID_COLUMNS → View 固有の列メタ）が diff 側だけ未整理。
- **テスト困難**: ハイライト条件は diff 表示の核ロジックだが、JSX と同居して単体テストしづらい。
- **lib が CSS に依存すべきでない**: 列の kind（check/marker/text/num）とハイライトフラグは lib、CSS クラスマッピングはコンポーネント側。

## 修正方針

**新規:** `frontend/src/lib/diffDisplayColumns.ts`

- `DiffCellKind` 型、`DisplayCol` 型（id, label, kind — cls は含めない）
- `DISPLAY_COLS`: `GRID_COLUMNS.map(...)` で kind を導出（現 FileDiffView L28–38 と同ロジック）
- `diffCellHighlight(row, colId, side)`: `'changed' | 'added' | 'removed' | null` を返す純関数

**変更:** `FileDiffView.tsx` / `DiffSideCells.tsx`

- `DISPLAY_COLS` の cls はコンポーネント側で `displayColClass(col)` のようなマッピング関数で付与
- ハイライトフラグ → CSS Module クラスはコンポーネント側でマッピング

**新規テスト:** `frontend/src/lib/diffDisplayColumns.test.ts`

- changed/added/removed 各 status でハイライトが正しく返るか

**やらないこと**

- `TableDefinitionView` の thead 手書きを GRID_COLUMNS 化（別タスク）

## 変更ファイル一覧

| before | after |
|--------|-------|
| `FileDiffView.tsx` L17–47, L88–98 | `diffDisplayColumns.ts`（新規） |
| — | `diffDisplayColumns.test.ts`（新規） |
| `DiffSideCells.tsx` | cls マッピングを担当 |

## 検証

```powershell
cd frontend
pnpm test -- diffDisplayColumns
pnpm storybook  # FileDiffView のハイライト表示
```

## 実施結果（実装後に追記）

- `frontend/src/lib/diffDisplayColumns.ts` に `DISPLAY_COLS` と `diffCellHighlight` を集約
- `diffDisplayColumns.test.ts` を追加（5 テスト）
- CSS クラスマッピングは `diffDisplayStyles.ts` に分離（lib は CSS 非依存）
