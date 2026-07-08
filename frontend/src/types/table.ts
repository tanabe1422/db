export type DataType =
  | 'bit'
  | 'tinyint'
  | 'smallint'
  | 'int'
  | 'bigint'
  | 'decimal'
  | 'numeric'
  | 'float'
  | 'real'
  | 'money'
  | 'smallmoney'
  | 'char'
  | 'nchar'
  | 'varchar'
  | 'nvarchar'
  | 'date'
  | 'time'
  | 'datetime'
  | 'datetime2'
  | 'smalldatetime'
  | 'datetimeoffset'
  | 'uniqueidentifier'
  | 'binary'
  | 'varbinary'
  | 'rowversion'

export type SortOrder = 'asc' | 'desc'

export interface IndexKey {
  column: string
  order?: SortOrder
}

export interface Index {
  keys: IndexKey[]
  include?: string[]
}

export interface UniqueConstraint {
  columns: string[]
}

export interface Column {
  name: string
  nameJa?: string
  dataType: string
  notNull?: boolean
  defaultValue?: string
  length?: number | 'max'
  precision?: number
  scale?: number
  unique?: boolean
  identity?: boolean
  remarks?: string
}

export interface TableDefinition {
  schemaVersion: number
  name: string
  nameJa?: string
  description?: string
  primaryKey?: string[]
  columns: Column[]
  indexes?: Index[]
  uniqueIndexes?: Index[]
  uniqueConstraints?: UniqueConstraint[]
}
