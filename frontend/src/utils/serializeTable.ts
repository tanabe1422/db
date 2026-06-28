import type {
  Column,
  DataType,
  Index,
  IndexKey,
  TableDefinition,
} from '../types'
import { MAX_INDEXES, indexMarker } from './columnMeta'

// 編集中の1行（カラム）。数値・既定値は生のテキストで保持し、保存時に正規化する。
export interface DraftColumn {
  rowId: number
  name: string
  nameJa: string
  dataType: DataType
  notNull: boolean
  unique: boolean
  pk: boolean
  length: string
  precision: string
  scale: string
  defaultValue: string
  remarks: string
  // Index 1〜MAX_INDEXES のマーカー（手入力）。例: "1", "2d", "(1)"
  markers: string[]
}

export interface DraftTable {
  schemaVersion: number
  name: string
  nameJa: string
  description: string
  // $schema など型に含まれないトップレベルフィールドを保持する。
  extra: Record<string, unknown>
  columns: DraftColumn[]
}

const KNOWN_TOP_LEVEL_KEYS = new Set([
  '$schema',
  'schemaVersion',
  'name',
  'nameJa',
  'description',
  'primaryKey',
  'columns',
  'indexes',
])

function emptyMarkers(): string[] {
  return Array.from({ length: MAX_INDEXES }, () => '')
}

export function createEmptyDraftColumn(rowId: number): DraftColumn {
  return {
    rowId,
    name: '',
    nameJa: '',
    dataType: 'int',
    notNull: false,
    unique: false,
    pk: false,
    length: '',
    precision: '',
    scale: '',
    defaultValue: '',
    remarks: '',
    markers: emptyMarkers(),
  }
}

function numberToText(value: number | undefined): string {
  return value == null ? '' : String(value)
}

function defaultValueToText(value: Column['defaultValue']): string {
  if (value === undefined) {
    return ''
  }
  if (value === null) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return String(value)
}

// TableDefinition -> 編集用 Draft。マーカーのグリッドは indexes から復元する。
export function toDraft(
  definition: TableDefinition,
  nextRowId: () => number,
): DraftTable {
  const primaryKey = new Set(definition.primaryKey ?? [])
  const indexes = definition.indexes ?? []

  const columns: DraftColumn[] = definition.columns.map((column) => {
    const markers = emptyMarkers()
    indexes.forEach((index, position) => {
      if (position < MAX_INDEXES) {
        markers[position] = indexMarker(index, column.name)
      }
    })

    return {
      rowId: nextRowId(),
      name: column.name,
      nameJa: column.nameJa ?? '',
      dataType: column.dataType,
      notNull: column.notNull ?? false,
      unique: column.unique ?? false,
      pk: primaryKey.has(column.name),
      length: numberToText(column.length),
      precision: numberToText(column.precision),
      scale: numberToText(column.scale),
      defaultValue: defaultValueToText(column.defaultValue),
      remarks: column.remarks ?? '',
      markers,
    }
  })

  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(definition)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key)) {
      extra[key] = value
    }
  }
  const schemaRef = (definition as unknown as Record<string, unknown>)['$schema']
  if (typeof schemaRef === 'string') {
    extra['$schema'] = schemaRef
  }

  return {
    schemaVersion: definition.schemaVersion,
    name: definition.name,
    nameJa: definition.nameJa ?? '',
    description: definition.description ?? '',
    extra,
    columns,
  }
}

function parseIntOrUndefined(text: string): number | undefined {
  const trimmed = text.trim()
  if (trimmed === '') {
    return undefined
  }
  const value = Number(trimmed)
  return Number.isFinite(value) ? Math.trunc(value) : undefined
}

function parseDefaultValue(text: string): Column['defaultValue'] | undefined {
  const trimmed = text.trim()
  if (trimmed === '') {
    return undefined
  }
  if (trimmed.toUpperCase() === 'NULL') {
    return null
  }
  if (trimmed === 'true') {
    return true
  }
  if (trimmed === 'false') {
    return false
  }
  const num = Number(trimmed)
  if (trimmed !== '' && Number.isFinite(num) && String(num) === trimmed) {
    return num
  }
  return text
}

// マーカーグリッド -> indexes 配列。マーカーが1つも無い列は省略（詰める）。
export function markersToIndexes(columns: DraftColumn[]): Index[] {
  const keyPattern = /^(\d+)(d)?$/i
  const includePattern = /^\((\d+)\)$/

  const indexes: Index[] = []

  for (let position = 0; position < MAX_INDEXES; position += 1) {
    const keyEntries: { column: string; orderNum: number; desc: boolean }[] = []
    const includeEntries: { column: string; orderNum: number }[] = []

    columns.forEach((column) => {
      const marker = column.markers[position]?.trim() ?? ''
      if (marker === '') {
        return
      }
      const keyMatch = keyPattern.exec(marker)
      if (keyMatch) {
        keyEntries.push({
          column: column.name,
          orderNum: Number(keyMatch[1]),
          desc: keyMatch[2] != null,
        })
        return
      }
      const includeMatch = includePattern.exec(marker)
      if (includeMatch) {
        includeEntries.push({
          column: column.name,
          orderNum: Number(includeMatch[1]),
        })
      }
    })

    if (keyEntries.length === 0 && includeEntries.length === 0) {
      continue
    }

    keyEntries.sort((a, b) => a.orderNum - b.orderNum)
    includeEntries.sort((a, b) => a.orderNum - b.orderNum)

    const keys: IndexKey[] = keyEntries.map((entry) =>
      entry.desc ? { column: entry.column, order: 'desc' } : { column: entry.column },
    )

    const index: Index = { keys }
    if (includeEntries.length > 0) {
      index.include = includeEntries.map((entry) => entry.column)
    }
    indexes.push(index)
  }

  return indexes
}

function draftColumnToColumn(draft: DraftColumn): Column {
  const column: Column = {
    name: draft.name.trim(),
    dataType: draft.dataType,
  }

  const nameJa = draft.nameJa.trim()
  if (nameJa !== '') {
    column.nameJa = nameJa
  }
  if (draft.notNull) {
    column.notNull = true
  }
  if (draft.unique) {
    column.unique = true
  }

  const length = parseIntOrUndefined(draft.length)
  if (length != null) {
    column.length = length
  }
  const precision = parseIntOrUndefined(draft.precision)
  if (precision != null) {
    column.precision = precision
  }
  const scale = parseIntOrUndefined(draft.scale)
  if (scale != null) {
    column.scale = scale
  }

  const defaultValue = parseDefaultValue(draft.defaultValue)
  if (defaultValue !== undefined) {
    column.defaultValue = defaultValue
  }

  const remarks = draft.remarks.trim()
  if (remarks !== '') {
    column.remarks = remarks
  }

  return column
}

// Draft -> 保存用のプレーンオブジェクト（空の任意項目は除去）。
export function cleanDefinition(draft: DraftTable): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (typeof draft.extra['$schema'] === 'string') {
    result['$schema'] = draft.extra['$schema']
  }

  result.schemaVersion = draft.schemaVersion
  result.name = draft.name

  const nameJa = draft.nameJa.trim()
  if (nameJa !== '') {
    result.nameJa = nameJa
  }
  const description = draft.description.trim()
  if (description !== '') {
    result.description = description
  }

  const primaryKey = draft.columns
    .filter((column) => column.pk)
    .map((column) => column.name.trim())
    .filter((name) => name !== '')
  if (primaryKey.length > 0) {
    result.primaryKey = primaryKey
  }

  result.columns = draft.columns.map(draftColumnToColumn)

  const indexes = markersToIndexes(draft.columns)
  if (indexes.length > 0) {
    result.indexes = indexes
  }

  for (const [key, value] of Object.entries(draft.extra)) {
    if (key !== '$schema' && !KNOWN_TOP_LEVEL_KEYS.has(key)) {
      result[key] = value
    }
  }

  return result
}

export function serialize(draft: DraftTable): string {
  return `${JSON.stringify(cleanDefinition(draft), null, 2)}\n`
}
