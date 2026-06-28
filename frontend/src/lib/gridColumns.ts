import { MAX_INDEXES, isDecimal } from '../utils/columnMeta'
import type { DraftColumn } from '../utils/serializeTable'

// カラムのフラグ系プロパティ（チェックボックス列）。
export type FlagField = 'pk' | 'notNull' | 'unique'

// グリッド列の意味的な役割。描画上の見た目（select/num など）は各 View が role から導出する。
export type ColumnRole = 'check' | 'marker' | 'text' | 'key'

export interface GridColumn {
  id: string
  label: string
  role: ColumnRole
  // role が 'check' の列が対応するフラグ。
  flag?: FlagField
}

const indexColumns: GridColumn[] = Array.from(
  { length: MAX_INDEXES },
  (_, i) => ({ id: `idx${i}`, label: String(i + 1), role: 'marker' }),
)

// テーブル定義グリッドの列順・ラベル・役割の単一情報源。
// 編集グリッド(NAV_COLS)・差分表示(DISPLAY_COLS)・比較(COMPARE_COLS)はすべてこれから導出する。
export const GRID_COLUMNS: GridColumn[] = [
  { id: 'pk', label: 'PK', role: 'check', flag: 'pk' },
  ...indexColumns,
  { id: 'uq', label: 'UQ', role: 'check', flag: 'unique' },
  { id: 'nn', label: 'NN', role: 'check', flag: 'notNull' },
  { id: 'name', label: 'カラム名（英）', role: 'key' },
  { id: 'nameJa', label: 'カラム名（日）', role: 'text' },
  { id: 'dataType', label: '型', role: 'text' },
  { id: 'len', label: '桁数', role: 'text' },
  { id: 'scale', label: '精度', role: 'text' },
  { id: 'default', label: '既定値', role: 'text' },
  { id: 'remarks', label: '備考', role: 'text' },
]

const columnById = new Map(GRID_COLUMNS.map((column) => [column.id, column]))

export function columnRole(colId: string): ColumnRole {
  return columnById.get(colId)?.role ?? 'text'
}

export function flagFor(colId: string): FlagField {
  return columnById.get(colId)?.flag ?? 'notNull'
}

// 差分比較の対象 colId（キー列 name は値ではなくマッチングに使うため除外）。
export const COMPARE_COLS: string[] = GRID_COLUMNS.filter(
  (column) => column.role !== 'key',
).map((column) => column.id)

// DraftColumn の指定セルを表示用文字列にする。チェック列は '1' / '0' を返す。
export function cellValue(column: DraftColumn, colId: string): string {
  switch (colId) {
    case 'pk':
      return column.pk ? '1' : '0'
    case 'uq':
      return column.unique ? '1' : '0'
    case 'nn':
      return column.notNull ? '1' : '0'
    case 'name':
      return column.name
    case 'nameJa':
      return column.nameJa
    case 'dataType':
      return column.dataType
    case 'len':
      return isDecimal(column.dataType) ? column.precision : column.length
    case 'scale':
      return column.scale
    case 'default':
      return column.defaultValue
    case 'remarks':
      return column.remarks
    default:
      if (colId.startsWith('idx')) {
        return column.markers[Number(colId.slice(3))] ?? ''
      }
      return ''
  }
}
