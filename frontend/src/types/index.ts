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

export interface GitCommit {
  hash: string
  shortHash: string
  subject: string
  date: string
}

export interface GitRepoInfo {
  isRepo: boolean
  repoRoot: string
}

export type {
  Column,
  DataType,
  Index,
  IndexKey,
  SortOrder,
  TableDefinition,
} from './table'
