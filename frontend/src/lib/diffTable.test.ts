import { describe, expect, it } from 'vitest'

import type { TableDefinition } from '../types'
import { diffTable } from './diffTable'

function base(): TableDefinition {
  return {
    schemaVersion: 1,
    name: 'users',
    nameJa: 'ユーザー',
    description: '利用者',
    primaryKey: ['id'],
    columns: [
      { name: 'id', dataType: 'bigint', notNull: true },
      { name: 'email', dataType: 'nvarchar', notNull: true, length: 255 },
    ],
  }
}

describe('diffTable', () => {
  it('reports no changes for identical definitions', () => {
    const diff = diffTable(base(), base())
    expect(diff.hasChanges).toBe(false)
    expect(diff.rows.every((row) => row.status === 'same')).toBe(true)
  })

  it('detects a changed cell (dataType)', () => {
    const right = base()
    right.columns[0] = { ...right.columns[0], dataType: 'int' }
    const diff = diffTable(base(), right)
    expect(diff.hasChanges).toBe(true)
    const idRow = diff.rows.find((row) => row.name === 'id')
    expect(idRow?.status).toBe('changed')
    expect(idRow?.changed.has('dataType')).toBe(true)
  })

  it('detects an added column (right only)', () => {
    const right = base()
    right.columns.push({ name: 'createdAt', dataType: 'datetime2', notNull: true })
    const diff = diffTable(base(), right)
    const added = diff.rows.find((row) => row.name === 'createdAt')
    expect(added?.status).toBe('added')
    expect(added?.left).toBeUndefined()
    expect(added?.right).toBeDefined()
  })

  it('keeps added columns at their right-side position', () => {
    const right = base()
    right.columns.splice(1, 0, { name: 'createdAt', dataType: 'datetime2', notNull: true })
    const diff = diffTable(base(), right)
    expect(diff.rows.map((row) => row.name)).toEqual(['id', 'createdAt', 'email'])
    expect(diff.rows[1]?.status).toBe('added')
  })

  it('keeps removed columns at their left-side position', () => {
    const left = base()
    left.columns.splice(1, 0, { name: 'deletedAt', dataType: 'datetime2' })
    const diff = diffTable(left, base())
    expect(diff.rows.map((row) => row.name)).toEqual(['id', 'deletedAt', 'email'])
    expect(diff.rows[1]?.status).toBe('removed')
  })

  it('detects a removed column (left only)', () => {
    const left = base()
    left.columns.push({ name: 'deletedAt', dataType: 'datetime2' })
    const diff = diffTable(left, base())
    const removed = diff.rows.find((row) => row.name === 'deletedAt')
    expect(removed?.status).toBe('removed')
    expect(removed?.right).toBeUndefined()
  })

  it('ignores reordering when contents match', () => {
    const right = base()
    right.columns = [right.columns[1], right.columns[0]]
    const diff = diffTable(base(), right)
    expect(diff.hasChanges).toBe(false)
    expect(diff.rows.every((row) => row.status === 'same')).toBe(true)
  })

  it('detects meta differences (description)', () => {
    const right = base()
    right.description = '変更後の説明'
    const diff = diffTable(base(), right)
    expect(diff.hasChanges).toBe(true)
    const metaRow = diff.meta.find((row) => row.field === 'description')
    expect(metaRow?.changed).toBe(true)
  })

  it('detects index marker differences', () => {
    const left = base()
    const right = base()
    right.indexes = [{ keys: [{ column: 'email' }] }]
    const diff = diffTable(left, right)
    expect(diff.hasChanges).toBe(true)
    const emailRow = diff.rows.find((row) => row.name === 'email')
    expect(emailRow?.status).toBe('changed')
    expect(emailRow?.changed.has('idx0')).toBe(true)
  })

  it('treats one-sided file as all added / removed', () => {
    const addedDiff = diffTable(null, base())
    expect(addedDiff.rows.every((row) => row.status === 'added')).toBe(true)
    const removedDiff = diffTable(base(), null)
    expect(removedDiff.rows.every((row) => row.status === 'removed')).toBe(true)
  })
})
