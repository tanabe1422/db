import type { TreeNode } from '../types'

export interface LeafFile {
  relPath: string
  fullPath: string
}

export function collectFiles(node: TreeNode, prefix = ''): LeafFile[] {
  const files: LeafFile[] = []
  for (const child of node.children) {
    if (child.isDir) {
      files.push(...collectFiles(child, `${prefix}${child.name}/`))
    } else {
      files.push({ relPath: `${prefix}${child.name}`, fullPath: child.path })
    }
  }
  return files
}
