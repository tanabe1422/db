import type { TableDefinition } from '../types'
import { type DraftColumn, toDraft } from '../utils/serializeTable'
import { COMPARE_COLS, cellValue } from './gridColumns'

export type DiffStatus = 'same' | 'changed' | 'added' | 'removed'

export interface ColumnDiffRow {
  // name はキーなので一致行では左右で同じ。added/removed では片側のみ。
  name: string
  status: DiffStatus
  left?: DraftColumn
  right?: DraftColumn
  // 値が変わったセルの colId 集合（pk / idx0.. / uq / nn / nameJa / dataType / len / scale / default / remarks）。
  changed: Set<string>
}

export interface MetaDiffRow {
  field: string
  label: string
  left: string
  right: string
  changed: boolean
}

export interface TableDiff {
  meta: MetaDiffRow[]
  rows: ColumnDiffRow[]
  hasChanges: boolean
}

function diffColumnCells(left: DraftColumn, right: DraftColumn): Set<string> {
  const changed = new Set<string>()
  for (const colId of COMPARE_COLS) {
    if (cellValue(left, colId) !== cellValue(right, colId)) {
      changed.add(colId)
    }
  }
  return changed
}

function metaValue(def: TableDefinition, field: string): string {
  switch (field) {
    case 'name':
      return def.name ?? ''
    case 'nameJa':
      return def.nameJa ?? ''
    case 'description':
      return def.description ?? ''
    case 'primaryKey':
      return (def.primaryKey ?? []).join(', ')
    default:
      return ''
  }
}

export interface MetaFieldDef {
  field: string
  label: string
  // 値を折り返し表示する項目（説明文など）。
  wrap?: boolean
}

// メタ情報の項目定義（差分計算と差分表示パネルで共有）。
export const META_FIELDS: MetaFieldDef[] = [
  { field: 'name', label: 'テーブル名（英）' },
  { field: 'nameJa', label: 'テーブル名（日）' },
  { field: 'description', label: 'テーブル説明', wrap: true },
  { field: 'primaryKey', label: '主キー' },
]

function buildMeta(
  left: TableDefinition | null,
  right: TableDefinition | null,
): MetaDiffRow[] {
  return META_FIELDS.map(({ field, label }) => {
    const leftValue = left ? metaValue(left, field) : ''
    const rightValue = right ? metaValue(right, field) : ''
    return {
      field,
      label,
      left: leftValue,
      right: rightValue,
      changed: leftValue !== rightValue,
    }
  })
}

// 左右のテーブル定義を比較する。並べ替えは差分とみなさず、英語列名でマッチする。
// 片側 null の場合（追加/削除されたファイル）は、存在する側の全行が added/removed になる。
export function diffTable(
  left: TableDefinition | null,
  right: TableDefinition | null,
): TableDiff {
  let rowId = 0
  const nextRowId = () => {
    rowId += 1
    return rowId
  }

  const leftCols = left ? toDraft(left, nextRowId).columns : []
  const rightCols = right ? toDraft(right, nextRowId).columns : []

  const rightByName = new Map<string, DraftColumn>()
  rightCols.forEach((column) => {
    if (!rightByName.has(column.name)) {
      rightByName.set(column.name, column)
    }
  })

  const consumed = new Set<string>()
  const rows: ColumnDiffRow[] = []

  for (const leftCol of leftCols) {
    const match = rightByName.get(leftCol.name)
    if (match && !consumed.has(leftCol.name)) {
      consumed.add(leftCol.name)
      const changed = diffColumnCells(leftCol, match)
      rows.push({
        name: leftCol.name,
        status: changed.size > 0 ? 'changed' : 'same',
        left: leftCol,
        right: match,
        changed,
      })
    } else {
      rows.push({
        name: leftCol.name,
        status: 'removed',
        left: leftCol,
        changed: new Set(),
      })
    }
  }

  for (const rightCol of rightCols) {
    if (consumed.has(rightCol.name)) {
      continue
    }
    rows.push({
      name: rightCol.name,
      status: 'added',
      right: rightCol,
      changed: new Set(),
    })
  }

  const meta = buildMeta(left, right)
  const hasChanges =
    rows.some((row) => row.status !== 'same') ||
    meta.some((row) => row.changed)

  return { meta, rows, hasChanges }
}
