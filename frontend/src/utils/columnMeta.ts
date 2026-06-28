import type { Column, DataType, Index, TableDefinition } from '../types'

export const MAX_INDEXES = 9

// 桁数(len)に precision を使う型。decimal/numeric は小数点以下桁数(scale)を持つ。
export function isDecimal(dataType: DataType): boolean {
  return dataType === 'decimal' || dataType === 'numeric'
}

export function pkOrder(def: TableDefinition, columnName: string): string {
  const index = def.primaryKey?.indexOf(columnName) ?? -1
  return index >= 0 ? String(index + 1) : ''
}

export function indexMarker(index: Index, columnName: string): string {
  const keyPos = index.keys.findIndex((key) => key.column === columnName)
  if (keyPos >= 0) {
    const key = index.keys[keyPos]
    return key.order === 'desc' ? `${keyPos + 1}d` : String(keyPos + 1)
  }

  const includePos = index.include?.indexOf(columnName) ?? -1
  if (includePos >= 0) {
    return `(${includePos + 1})`
  }

  return ''
}

// 桁数: 文字列・バイナリ型は length、decimal/numeric は precision（整数・小数の合計桁数）。
export function columnLength(column: Column): string {
  if (column.length != null) {
    return String(column.length)
  }
  if (column.precision != null) {
    return String(column.precision)
  }
  return ''
}

// 精度: decimal/numeric の小数部桁数（scale）。
export function columnScale(column: Column): string {
  return column.scale != null ? String(column.scale) : ''
}

export function formatDefault(value: Column['defaultValue']): string {
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
