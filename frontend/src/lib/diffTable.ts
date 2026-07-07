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

  const leftByName = new Map<string, DraftColumn>()
  leftCols.forEach((column) => {
    if (!leftByName.has(column.name)) {
      leftByName.set(column.name, column)
    }
  })

  const consumed = new Set<string>()
  const rows: ColumnDiffRow[] = []

  // right の並びを基準にマージする。right のみの列はその位置に、left のみの列は
  // 対応する right 行の直前（または末尾）に出す。
  if (rightCols.length === 0) {
    for (const leftCol of leftCols) {
      rows.push({
        name: leftCol.name,
        status: 'removed',
        left: leftCol,
        changed: new Set(),
      })
    }
  } else {
    let leftIndex = 0

    for (const rightCol of rightCols) {
      const leftMatch = leftByName.get(rightCol.name)

      if (leftMatch && !consumed.has(rightCol.name)) {
        while (leftIndex < leftCols.length) {
          const leftCol = leftCols[leftIndex]
          if (leftCol.name === rightCol.name) {
            consumed.add(leftCol.name)
            leftIndex += 1
            const changed = diffColumnCells(leftCol, rightCol)
            rows.push({
              name: leftCol.name,
              status: changed.size > 0 ? 'changed' : 'same',
              left: leftCol,
              right: rightCol,
              changed,
            })
            break
          }
          if (!rightByName.has(leftCol.name)) {
            rows.push({
              name: leftCol.name,
              status: 'removed',
              left: leftCol,
              changed: new Set(),
            })
          }
          leftIndex += 1
        }
      } else if (!leftMatch) {
        rows.push({
          name: rightCol.name,
          status: 'added',
          right: rightCol,
          changed: new Set(),
        })
      }
    }

    while (leftIndex < leftCols.length) {
      const leftCol = leftCols[leftIndex]
      if (!consumed.has(leftCol.name)) {
        rows.push({
          name: leftCol.name,
          status: 'removed',
          left: leftCol,
          changed: new Set(),
        })
      }
      leftIndex += 1
    }
  }

  const meta = buildMeta(left, right)
  const hasChanges =
    rows.some((row) => row.status !== 'same') ||
    meta.some((row) => row.changed)

  return { meta, rows, hasChanges }
}

/** Diff 表示の No 列。片側空行では null（連番を振らない）。 */
export function diffSideRowNumber(
  rows: ColumnDiffRow[],
  index: number,
  side: 'left' | 'right',
): number | null {
  const column = side === 'left' ? rows[index]?.left : rows[index]?.right
  if (!column) {
    return null
  }
  let number = 0
  for (let i = 0; i <= index; i++) {
    if (side === 'left' ? rows[i].left : rows[i].right) {
      number += 1
    }
  }
  return number
}
