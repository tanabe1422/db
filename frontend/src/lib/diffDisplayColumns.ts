import { GRID_COLUMNS } from './gridColumns'
import type { ColumnDiffRow } from './diffTable'

export type DiffCellKind = 'check' | 'marker' | 'text' | 'num'

export interface DisplayCol {
  id: string
  label: string
  kind: DiffCellKind
}

export type DiffCellHighlight = 'changed' | 'added' | 'removed'

// 差分表示の列は共通の列定義(GRID_COLUMNS)から導出する。
// 桁数/精度は数値列、カラム名/型は等幅表示にする（cls はコンポーネント側で付与）。
export const DISPLAY_COLS: DisplayCol[] = GRID_COLUMNS.map((column) => ({
  id: column.id,
  label: column.label,
  kind:
    column.role === 'check'
      ? 'check'
      : column.role === 'marker'
        ? 'marker'
        : column.id === 'len' || column.id === 'scale'
          ? 'num'
          : 'text',
}))

export function diffCellHighlight(
  row: ColumnDiffRow,
  colId: string,
  side: 'left' | 'right',
): DiffCellHighlight | null {
  if (row.status === 'changed' && row.changed.has(colId)) {
    return 'changed'
  }
  if (row.status === 'added' && side === 'right') {
    return 'added'
  }
  if (row.status === 'removed' && side === 'left') {
    return 'removed'
  }
  return null
}
