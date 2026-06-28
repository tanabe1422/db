export interface Settings {
  directories: string[]
  activeDirectory: string
}

export interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
}

export type {
  Column,
  DataType,
  Index,
  IndexKey,
  SortOrder,
  TableDefinition,
} from './table'
