import type { TableDefinition } from '../types/table'

export interface ValidationError {
  path: string
  message: string
}

const IDENTITY_TYPES = new Set(['tinyint', 'smallint', 'int', 'bigint'])

export function parseBaseDataType(dataType: string): string {
  const trimmed = dataType.trim()
  if (!trimmed) {
    return ''
  }

  const token = trimmed.split(/\s+/)[0]
  const parenIndex = token.indexOf('(')
  if (parenIndex >= 0) {
    return token.slice(0, parenIndex).toLowerCase()
  }
  return token.toLowerCase()
}

function isDecimalType(dataType: string): boolean {
  const base = parseBaseDataType(dataType)
  return base === 'decimal' || base === 'numeric'
}

export function validateTableSemantic(def: TableDefinition): ValidationError[] {
  const errors: ValidationError[] = []
  const columnNames = new Map<string, number>()
  let identityColumnIndex: number | null = null

  def.columns.forEach((col, index) => {
    if (columnNames.has(col.name)) {
      errors.push({
        path: `/columns/${index}/name`,
        message: `duplicate column name "${col.name}"`,
      })
    }
    columnNames.set(col.name, index)

    const baseType = parseBaseDataType(col.dataType)

    if (
      isDecimalType(col.dataType) &&
      col.precision != null &&
      col.scale != null &&
      col.scale > col.precision
    ) {
      errors.push({
        path: `/columns/${index}/scale`,
        message: `scale (${col.scale}) must not exceed precision (${col.precision})`,
      })
    }

    if (col.identity) {
      if (identityColumnIndex != null) {
        errors.push({
          path: `/columns/${index}/identity`,
          message: 'only one identity column is allowed per table',
        })
      } else {
        identityColumnIndex = index
      }

      if (!IDENTITY_TYPES.has(baseType)) {
        errors.push({
          path: `/columns/${index}/identity`,
          message: `identity is only allowed on integer types (tinyint, smallint, int, bigint), got "${col.dataType}"`,
        })
      }

      if (baseType === 'rowversion') {
        errors.push({
          path: `/columns/${index}/identity`,
          message: 'identity cannot be used with rowversion',
        })
      }
    }
  })

  def.primaryKey?.forEach((pkCol, index) => {
    if (!columnNames.has(pkCol)) {
      errors.push({
        path: `/primaryKey/${index}`,
        message: `unknown column "${pkCol}"`,
      })
    }
  })

  def.indexes?.forEach((idx, index) => {
    idx.keys.forEach((key, keyIndex) => {
      if (!columnNames.has(key.column)) {
        errors.push({
          path: `/indexes/${index}/keys/${keyIndex}/column`,
          message: `unknown column "${key.column}"`,
        })
      }
    })
    idx.include?.forEach((col, includeIndex) => {
      if (!columnNames.has(col)) {
        errors.push({
          path: `/indexes/${index}/include/${includeIndex}`,
          message: `unknown column "${col}"`,
        })
      }
    })
  })

  def.uniqueConstraints?.forEach((constraint, index) => {
    constraint.columns.forEach((col, colIndex) => {
      if (!columnNames.has(col)) {
        errors.push({
          path: `/uniqueConstraints/${index}/columns/${colIndex}`,
          message: `unknown column "${col}"`,
        })
      }
    })
  })

  return errors
}
