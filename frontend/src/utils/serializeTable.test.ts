import { describe, expect, it } from 'vitest'

import type { TableDefinition } from '../types'
import {
  normalizeDefaultValue,
  normalizeTableDefinition,
  serialize,
  toDraft,
} from './serializeTable'

function baseDefinition(overrides?: Partial<TableDefinition>): TableDefinition {
  return {
    schemaVersion: 1,
    name: 'users',
    columns: [{ name: 'id', dataType: 'int' }],
    ...overrides,
  }
}

describe('normalizeDefaultValue', () => {
  it('returns undefined for undefined and empty string', () => {
    expect(normalizeDefaultValue(undefined)).toBeUndefined()
    expect(normalizeDefaultValue('')).toBeUndefined()
    expect(normalizeDefaultValue('   ')).toBeUndefined()
  })

  it('converts legacy null to NULL', () => {
    expect(normalizeDefaultValue(null)).toBe('NULL')
  })

  it('converts legacy number and boolean', () => {
    expect(normalizeDefaultValue(0)).toBe('0')
    expect(normalizeDefaultValue(1)).toBe('1')
    expect(normalizeDefaultValue(true)).toBe('true')
    expect(normalizeDefaultValue(false)).toBe('false')
  })

  it('keeps SQL literal strings as-is', () => {
    expect(normalizeDefaultValue('NULL')).toBe('NULL')
    expect(normalizeDefaultValue("N'Hoge'")).toBe("N'Hoge'")
  })
})

describe('normalizeTableDefinition', () => {
  it('normalizes legacy defaultValue types in columns', () => {
    const normalized = normalizeTableDefinition({
      schemaVersion: 1,
      name: 'users',
      columns: [
        { name: 'a', dataType: 'int', defaultValue: 0 },
        { name: 'b', dataType: 'varchar', defaultValue: null },
        { name: 'c', dataType: 'varchar', defaultValue: 'NULL' },
      ],
    }) as TableDefinition

    expect(normalized.columns[0].defaultValue).toBe('0')
    expect(normalized.columns[1].defaultValue).toBe('NULL')
    expect(normalized.columns[2].defaultValue).toBe('NULL')
  })
})

describe('defaultValue round-trip', () => {
  it('serializes NULL as string', () => {
    let rowId = 0
    const nextRowId = () => {
      rowId += 1
      return rowId
    }

    const draft = toDraft(
      baseDefinition({
        columns: [{ name: 'status', dataType: 'varchar', defaultValue: 'NULL' }],
      }),
      nextRowId,
    )

    const json = JSON.parse(serialize(draft)) as TableDefinition
    expect(json.columns[0].defaultValue).toBe('NULL')
  })

  it('serializes numeric and string SQL literals as strings', () => {
    let rowId = 0
    const nextRowId = () => {
      rowId += 1
      return rowId
    }

    const draft = toDraft(
      baseDefinition({
        columns: [
          { name: 'count', dataType: 'int', defaultValue: '0' },
          { name: 'label', dataType: 'nvarchar', defaultValue: "N'Hoge'" },
        ],
      }),
      nextRowId,
    )

    const json = JSON.parse(serialize(draft)) as TableDefinition
    expect(json.columns[0].defaultValue).toBe('0')
    expect(json.columns[1].defaultValue).toBe("N'Hoge'")
  })

  it('omits empty defaultValue', () => {
    let rowId = 0
    const nextRowId = () => {
      rowId += 1
      return rowId
    }

    const draft = toDraft(
      baseDefinition({
        columns: [{ name: 'id', dataType: 'int' }],
      }),
      nextRowId,
    )

    const json = JSON.parse(serialize(draft)) as TableDefinition
    expect(json.columns[0].defaultValue).toBeUndefined()
  })

  it('round-trips legacy JSON defaultValue types through draft', () => {
    let rowId = 0
    const nextRowId = () => {
      rowId += 1
      return rowId
    }

    const legacy = {
      schemaVersion: 1,
      name: 'users',
      columns: [
        { name: 'balance', dataType: 'decimal', defaultValue: 0 },
        { name: 'note', dataType: 'nvarchar', defaultValue: null },
      ],
    }

    const normalized = normalizeTableDefinition(legacy) as TableDefinition
    const draft = toDraft(normalized, nextRowId)
    const json = JSON.parse(serialize(draft)) as TableDefinition

    expect(draft.columns[0].defaultValue).toBe('0')
    expect(draft.columns[1].defaultValue).toBe('NULL')
    expect(json.columns[0].defaultValue).toBe('0')
    expect(json.columns[1].defaultValue).toBe('NULL')
  })
})
