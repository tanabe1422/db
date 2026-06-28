import type { TableDefinition } from '../types/table'
import { isDecimal } from '../utils/columnMeta'

export interface ValidationError {
  path: string
  message: string
}

export function validateTableSemantic(def: TableDefinition): ValidationError[] {
  const errors: ValidationError[] = []
  const columnNames = new Map<string, number>()

  def.columns.forEach((col, index) => {
    if (columnNames.has(col.name)) {
      errors.push({
        path: `/columns/${index}/name`,
        message: `duplicate column name "${col.name}"`,
      })
    }
    columnNames.set(col.name, index)

    if (
      isDecimal(col.dataType) &&
      col.precision != null &&
      col.scale != null &&
      col.scale > col.precision
    ) {
      errors.push({
        path: `/columns/${index}/scale`,
        message: `scale (${col.scale}) must not exceed precision (${col.precision})`,
      })
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

  return errors
}
