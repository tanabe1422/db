# スクロール同期 hook の抽出

- Phase: 1
- 状態: 実装済み

## 現状

`frontend/src/components/diff/FileDiffView.tsx` L184–205 で左右ペインの水平スクロール同期を実装している。

```typescript
const leftRef = useRef<HTMLDivElement>(null)
const rightRef = useRef<HTMLDivElement>(null)
const syncingRef = useRef(false)

function handleLeftScroll() {
  if (syncingRef.current) return
  syncingRef.current = true
  if (rightRef.current && leftRef.current) {
    rightRef.current.scrollLeft = leftRef.current.scrollLeft
  }
  syncingRef.current = false
}
// handleRightScroll も同型
```

`SideTable` の `tableWrapper` div に ref と onScroll を渡し、左右で `scrollLeft` をミラーしている。`syncingRef` で再帰的 scroll イベントを防止。

## 課題と修正理由

- **UI パターンの直書き**: 双方向スクロール同期は汎用パターンだが、コンポーネント内に閉じている。
- **FileDiffView の肥大化**: 分割後もレイアウト以外のロジックが残る。
- **再利用性**: 将来の別 diff ビューや横並びテーブルでも同じ同期が必要になる可能性。

## 修正方針

**新規:** `frontend/src/hooks/useSyncedHorizontalScroll.ts`

```typescript
export function useSyncedHorizontalScroll() {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  const onLeftScroll = () => { /* mirror left → right */ }
  const onRightScroll = () => { /* mirror right → left */ }

  return { leftRef, rightRef, onLeftScroll, onRightScroll }
}
```

**変更:** `FileDiffView.tsx`

- インライン ref/ハンドラを削除し hook を利用

**やらないこと**

- 垂直スクロール同期（現状不要）
- 3 ペイン以上への拡張（YAGNI）

## 変更ファイル一覧

| before | after |
|--------|-------|
| `FileDiffView.tsx` L184–205 | `useSyncedHorizontalScroll.ts`（新規） |
| `FileDiffView.tsx` | hook 呼び出しのみ |

## 検証

```powershell
cd frontend
pnpm build
pnpm storybook  # FileDiffView で左右スクロール連動を確認
```

## 実施結果（実装後に追記）

- `frontend/src/hooks/useSyncedHorizontalScroll.ts` を新規作成
- `FileDiffView.tsx` から ref/ハンドラを削除し hook を利用
