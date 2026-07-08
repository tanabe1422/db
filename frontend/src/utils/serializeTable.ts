import type { Column, Index, IndexKey, TableDefinition, UniqueConstraint } from '../types'
import {
  MAX_INDEXES,
  MAX_UNIQUE_CONSTRAINTS,
  MAX_UNIQUE_INDEXES,
  constraintMarker,
  indexMarker,
} from './columnMeta'

export type MarkerField = 'markers' | 'uniqueIndexMarkers' | 'uniqueMarkers'

// 編集中の1行（カラム）。数値・既定値は生のテキストで保持し、保存時に正規化する。
export interface DraftColumn {
  rowId: number
  name: string
  nameJa: string
  dataType: string
  notNull: boolean
  identity: boolean
  pk: boolean
  length: string
  precision: string
  scale: string
  defaultValue: string
  remarks: string
  // Index 1〜MAX_INDEXES のマーカー（手入力）。例: "1", "2d", "(1)"
  markers: string[]
  // UniqueIndex 1〜MAX_UNIQUE_INDEXES のマーカー
  uniqueIndexMarkers: string[]
  // Unique 1〜MAX_UNIQUE_CONSTRAINTS のマーカー（複合 UNIQUE または単一カラム UNIQUE）
  uniqueMarkers: string[]
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
  'uniqueIndexes',
  'uniqueConstraints',
])

function emptyMarkers(length: number): string[] {
  return Array.from({ length }, () => '')
}

export function createEmptyDraftColumn(rowId: number): DraftColumn {
  return {
    rowId,
    name: '',
    nameJa: '',
    dataType: 'int',
    notNull: false,
    identity: false,
    pk: false,
    length: '',
    precision: '',
    scale: '',
    defaultValue: '',
    remarks: '',
    markers: emptyMarkers(MAX_INDEXES),
    uniqueIndexMarkers: emptyMarkers(MAX_UNIQUE_INDEXES),
    uniqueMarkers: emptyMarkers(MAX_UNIQUE_CONSTRAINTS),
  }
}

function numberToText(value: number | undefined): string {
  return value == null ? '' : String(value)
}

function lengthToText(value: Column['length']): string {
  if (value == null) {
    return ''
  }
  if (value === 'max') {
    return 'max'
  }
  return String(value)
}

// 旧形式（number / boolean / null）を含む JSON 値を SQL リテラル文字列へ正規化する。
export function normalizeDefaultValue(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }
  return String(value)
}

// 読み込み時に defaultValue を string 形式へ正規化する（旧 JSON 互換）。
export function normalizeTableDefinition(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || !('columns' in data)) {
    return data
  }

  const record = data as Record<string, unknown>
  const columns = record.columns
  if (!Array.isArray(columns)) {
    return data
  }

  return {
    ...record,
    columns: columns.map((column) => {
      if (typeof column !== 'object' || column === null) {
        return column
      }
      const entry = { ...(column as Record<string, unknown>) }
      if ('defaultValue' in entry) {
        const normalized = normalizeDefaultValue(entry.defaultValue)
        if (normalized === undefined) {
          delete entry.defaultValue
        } else {
          entry.defaultValue = normalized
        }
      }
      return entry
    }),
  }
}

function defaultValueToText(value: Column['defaultValue'] | unknown): string {
  return normalizeDefaultValue(value) ?? ''
}

function loadIndexMarkers(
  indexes: Index[],
  columnName: string,
  maxPositions: number,
): string[] {
  const markers = emptyMarkers(maxPositions)
  indexes.forEach((index, position) => {
    if (position < maxPositions) {
      markers[position] = indexMarker(index, columnName)
    }
  })
  return markers
}

function loadUniqueMarkers(
  uniqueConstraints: UniqueConstraint[],
  column: Column,
): string[] {
  const markers = emptyMarkers(MAX_UNIQUE_CONSTRAINTS)
  let inComposite = false

  uniqueConstraints.forEach((constraint, position) => {
    if (position < MAX_UNIQUE_CONSTRAINTS) {
      const marker = constraintMarker(constraint, column.name)
      if (marker !== '') {
        markers[position] = marker
        inComposite = true
      }
    }
  })

  if (column.unique && !inComposite) {
    markers[0] = '1'
  }

  return markers
}

// TableDefinition -> 編集用 Draft。マーカーのグリッドは indexes から復元する。
export function toDraft(
  definition: TableDefinition,
  nextRowId: () => number,
): DraftTable {
  const primaryKey = new Set(definition.primaryKey ?? [])
  const indexes = definition.indexes ?? []
  const uniqueIndexes = definition.uniqueIndexes ?? []
  const uniqueConstraints = definition.uniqueConstraints ?? []

  const columns: DraftColumn[] = definition.columns.map((column) => ({
    rowId: nextRowId(),
    name: column.name,
    nameJa: column.nameJa ?? '',
    dataType: column.dataType,
    notNull: column.notNull ?? false,
    identity: column.identity ?? false,
    pk: primaryKey.has(column.name),
    length: lengthToText(column.length),
    precision: numberToText(column.precision),
    scale: numberToText(column.scale),
    defaultValue: defaultValueToText(column.defaultValue),
    remarks: column.remarks ?? '',
    markers: loadIndexMarkers(indexes, column.name, MAX_INDEXES),
    uniqueIndexMarkers: loadIndexMarkers(
      uniqueIndexes,
      column.name,
      MAX_UNIQUE_INDEXES,
    ),
    uniqueMarkers: loadUniqueMarkers(uniqueConstraints, column),
  }))

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

function parseDefaultValue(text: string): string | undefined {
  const trimmed = text.trim()
  return trimmed === '' ? undefined : trimmed
}

// マーカーグリッド -> indexes 配列。マーカーが1つも無い列は省略（詰める）。
export function markersToIndexes(
  columns: DraftColumn[],
  field: MarkerField,
  maxPositions: number,
): Index[] {
  const keyPattern = /^(\d+)(d)?$/i
  const includePattern = /^\((\d+)\)$/

  const indexes: Index[] = []

  for (let position = 0; position < maxPositions; position += 1) {
    const keyEntries: { column: string; orderNum: number; desc: boolean }[] = []
    const includeEntries: { column: string; orderNum: number }[] = []

    columns.forEach((column) => {
      const marker = column[field][position]?.trim() ?? ''
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

function markersToUniqueConstraints(columns: DraftColumn[]): UniqueConstraint[] {
  const keyPattern = /^(\d+)$/i
  const constraints: UniqueConstraint[] = []

  for (let position = 0; position < MAX_UNIQUE_CONSTRAINTS; position += 1) {
    const entries: { column: string; orderNum: number }[] = []

    columns.forEach((column) => {
      const marker = column.uniqueMarkers[position]?.trim() ?? ''
      if (marker === '') {
        return
      }
      const match = keyPattern.exec(marker)
      if (match) {
        entries.push({
          column: column.name,
          orderNum: Number(match[1]),
        })
      }
    })

    if (entries.length < 2) {
      continue
    }

    entries.sort((a, b) => a.orderNum - b.orderNum)
    constraints.push({ columns: entries.map((entry) => entry.column) })
  }

  return constraints
}

function isSingleColumnUnique(
  column: DraftColumn,
  columns: DraftColumn[],
): boolean {
  for (let position = 0; position < MAX_UNIQUE_CONSTRAINTS; position += 1) {
    const entries = columns.filter((entry) => {
      const marker = entry.uniqueMarkers[position]?.trim() ?? ''
      return marker !== ''
    })
    if (entries.length === 1 && entries[0].rowId === column.rowId) {
      const marker = column.uniqueMarkers[position]?.trim() ?? ''
      return marker === '1'
    }
  }
  return false
}

function draftColumnToColumn(
  draft: DraftColumn,
  allColumns: DraftColumn[],
): Column {
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
  if (draft.identity) {
    column.identity = true
  }
  if (isSingleColumnUnique(draft, allColumns)) {
    column.unique = true
  }

  const lengthText = draft.length.trim()
  if (lengthText.toLowerCase() === 'max') {
    column.length = 'max'
  } else {
    const length = parseIntOrUndefined(draft.length)
    if (length != null) {
      column.length = length
    }
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

  result.columns = draft.columns.map((column) =>
    draftColumnToColumn(column, draft.columns),
  )

  const indexes = markersToIndexes(draft.columns, 'markers', MAX_INDEXES)
  if (indexes.length > 0) {
    result.indexes = indexes
  }

  const uniqueIndexes = markersToIndexes(
    draft.columns,
    'uniqueIndexMarkers',
    MAX_UNIQUE_INDEXES,
  )
  if (uniqueIndexes.length > 0) {
    result.uniqueIndexes = uniqueIndexes
  }

  const uniqueConstraints = markersToUniqueConstraints(draft.columns)
  if (uniqueConstraints.length > 0) {
    result.uniqueConstraints = uniqueConstraints
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
