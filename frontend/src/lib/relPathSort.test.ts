import { describe, expect, it } from 'vitest'

import { compareRelPaths } from './relPathSort'

function sorted(paths: string[]): string[] {
  return [...paths].sort(compareRelPaths)
}

describe('compareRelPaths', () => {
  it('lists root-level files before nested files', () => {
    expect(sorted(['tables/a.table.json', 'users.table.json'])).toEqual([
      'users.table.json',
      'tables/a.table.json',
    ])
  })

  it('lists direct files before deeper paths in the same directory', () => {
    expect(
      sorted(['foo/sub/x.table.json', 'foo/a.table.json', 'foo/b.table.json']),
    ).toEqual(['foo/a.table.json', 'foo/b.table.json', 'foo/sub/x.table.json'])
  })

  it('sorts siblings alphabetically within the same level', () => {
    expect(sorted(['b.table.json', 'a.table.json'])).toEqual([
      'a.table.json',
      'b.table.json',
    ])
  })
})
