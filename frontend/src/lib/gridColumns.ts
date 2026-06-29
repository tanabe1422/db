import {
  MAX_INDEXES,
  MAX_UNIQUE_CONSTRAINTS,
  MAX_UNIQUE_INDEXES,
  isDecimal,
} from '../utils/columnMeta'
import type { DraftColumn, MarkerField } from '../utils/serializeTable'

// カラムのフラグ系プロパティ（チェックボックス列）。
export type FlagField = 'pk' | 'notNull' | 'identity'

export const IDENTITY_COLUMN_LABEL = 'ID'
export const IDENTITY_COLUMN_TITLE =
  'SQL Server では IDENTITY と呼ばれる自動採番です'

export const UNIQUE_INDEX_GROUP_LABEL = 'UIDX'
export const UNIQUE_INDEX_GROUP_TITLE = 'Unique Index'

export const UNIQUE_CONSTRAINT_LABEL = 'UQ'
export const UNIQUE_CONSTRAINT_TITLE = 'UNIQUE constraint'

export const NOT_NULL_LABEL = 'NN'
export const NOT_NULL_TITLE = 'NOT NULL'

// グリッド列の意味的な役割。描画上の見た目（select/num など）は各 View が role から導出する。
export type ColumnRole = 'check' | 'marker' | 'text' | 'key'

export interface GridColumn {
  id: string
  label: string
  role: ColumnRole
  // role が 'check' の列が対応するフラグ。
  flag?: FlagField
  // role が 'marker' の列が対応する DraftColumn 上のマーカー配列。
  markerField?: MarkerField
}

function markerColumns(
  prefix: string,
  count: number,
  field: MarkerField,
): GridColumn[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i}`,
    label: String(i + 1),
    role: 'marker' as const,
    markerField: field,
  }))
}

// テーブル定義グリッドの列順・ラベル・役割の単一情報源。
// 編集グリッド(NAV_COLS)・差分表示(DISPLAY_COLS)・比較(COMPARE_COLS)はすべてこれから導出する。
export const GRID_COLUMNS: GridColumn[] = [
  { id: 'pk', label: 'PK', role: 'check', flag: 'pk' },
  ...markerColumns('uidx', MAX_UNIQUE_INDEXES, 'uniqueIndexMarkers'),
  ...markerColumns('idx', MAX_INDEXES, 'markers'),
  { id: 'identity', label: IDENTITY_COLUMN_LABEL, role: 'check', flag: 'identity' },
  ...markerColumns('uq', MAX_UNIQUE_CONSTRAINTS, 'uniqueMarkers'),
  { id: 'nn', label: NOT_NULL_LABEL, role: 'check', flag: 'notNull' },
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

export function markerFieldFor(colId: string): MarkerField | null {
  return columnById.get(colId)?.markerField ?? null
}

export function markerPosition(colId: string): number | null {
  const match = /^(?:uidx|idx|uq)(\d+)$/.exec(colId)
  return match ? Number(match[1]) : null
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
    case 'identity':
      return column.identity ? '1' : '0'
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
    default: {
      const field = markerFieldFor(colId)
      const position = markerPosition(colId)
      if (field != null && position != null) {
        return column[field][position] ?? ''
      }
      return ''
    }
  }
}
