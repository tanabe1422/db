import { describe, expect, it } from 'vitest'

import { getTreeFileKind, getTreeFileKindFromPath } from './treeFileKind'

describe('getTreeFileKind', () => {
  it('classifies supported tree file extensions', () => {
    expect(getTreeFileKind('users.table.json')).toBe('table-json')
    expect(getTreeFileKind('users.sql')).toBe('sql')
    expect(getTreeFileKind('users.migrate.sql')).toBe('sql')
    expect(getTreeFileKind('orders.xlsx')).toBe('xlsx')
    expect(getTreeFileKind('readme.txt')).toBe('other')
  })
})

describe('getTreeFileKindFromPath', () => {
  it('uses the basename of a path', () => {
    expect(getTreeFileKindFromPath('C:\\proj\\src\\db\\users.sql')).toBe('sql')
    expect(getTreeFileKindFromPath('src/db/users.table.json')).toBe('table-json')
  })
})
