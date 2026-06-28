import { describe, expect, it } from 'vitest'

import type { TreeNode } from '../types'

import { collectFiles } from './treeFiles'

function file(name: string, path: string): TreeNode {
  return { name, path, isDir: false, children: [] }
}

function dir(name: string, path: string, children: TreeNode[]): TreeNode {
  return { name, path, isDir: true, children }
}

describe('collectFiles', () => {
  it('collects leaf files with relPath and fullPath', () => {
    const root = dir('root', '/root', [
      file('a.table.json', '/root/a.table.json'),
      dir('tables', '/root/tables', [
        file('b.table.json', '/root/tables/b.table.json'),
      ]),
    ])

    expect(collectFiles(root)).toEqual([
      { relPath: 'a.table.json', fullPath: '/root/a.table.json' },
      { relPath: 'tables/b.table.json', fullPath: '/root/tables/b.table.json' },
    ])
  })

  it('returns empty array for directory with no files', () => {
    const root = dir('empty', '/empty', [
      dir('sub', '/empty/sub', []),
    ])

    expect(collectFiles(root)).toEqual([])
  })

  it('uses prefix for nested paths', () => {
    const root = dir('root', '/r', [
      dir('a', '/r/a', [file('x.json', '/r/a/x.json')]),
    ])

    expect(collectFiles(root, 'prefix/')).toEqual([
      { relPath: 'prefix/a/x.json', fullPath: '/r/a/x.json' },
    ])
  })
})
