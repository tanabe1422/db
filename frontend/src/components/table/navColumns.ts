import type { DataType } from '../../types'
import {
  MAX_INDEXES,
  MAX_UNIQUE_CONSTRAINTS,
  MAX_UNIQUE_INDEXES,
} from '../../utils/columnMeta'
import { GRID_COLUMNS } from '../../lib/gridColumns'

// 編集グリッドのセル種別。差分表示(DISPLAY_COLS)とは別に編集 UI 固有の概念。
export type CellKind = 'check' | 'text' | 'combobox' | 'marker'

export interface NavCol {
  id: string
  kind: CellKind
}

export const indexNumbers = Array.from({ length: MAX_INDEXES }, (_, i) => i + 1)
export const uniqueIndexNumbers = Array.from(
  { length: MAX_UNIQUE_INDEXES },
  (_, i) => i + 1,
)
export const uniqueNumbers = Array.from(
  { length: MAX_UNIQUE_CONSTRAINTS },
  (_, i) => i + 1,
)

// 編集グリッドのセル種別は共通の列定義(GRID_COLUMNS)から導出する。
// データ型は候補付き自由入力(combobox)、桁数/精度などは text 扱い。
export const NAV_COLS: NavCol[] = GRID_COLUMNS.map((column) => ({
  id: column.id,
  kind:
    column.role === 'check'
      ? 'check'
      : column.role === 'marker'
        ? 'marker'
        : column.id === 'dataType'
          ? 'combobox'
          : 'text',
}))

export function colKind(colId: string): CellKind {
  return NAV_COLS.find((c) => c.id === colId)?.kind ?? 'text'
}

export const DATA_TYPES: DataType[] = [
  'bit',
  'tinyint',
  'smallint',
  'int',
  'bigint',
  'decimal',
  'numeric',
  'float',
  'real',
  'money',
  'smallmoney',
  'char',
  'nchar',
  'varchar',
  'nvarchar',
  'date',
  'time',
  'datetime',
  'datetime2',
  'smalldatetime',
  'datetimeoffset',
  'uniqueidentifier',
  'binary',
  'varbinary',
]
