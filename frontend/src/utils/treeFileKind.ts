export type TreeFileKind = 'table-json' | 'sql' | 'xlsx' | 'other'

export function getTreeFileKind(name: string): TreeFileKind {
  const lower = name.toLowerCase()
  if (lower.endsWith('.table.json')) {
    return 'table-json'
  }
  if (lower.endsWith('.sql')) {
    return 'sql'
  }
  if (lower.endsWith('.xlsx')) {
    return 'xlsx'
  }
  return 'other'
}

export function getTreeFileKindFromPath(path: string): TreeFileKind {
  const parts = path.split(/[\\/]/)
  return getTreeFileKind(parts[parts.length - 1] || path)
}
