import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { validateTableDefinition } from './validateTable'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function loadUsersExample(): unknown {
  const path = resolve(repoRoot, 'examples/users.table.json')
  return JSON.parse(readFileSync(path, 'utf8'))
}

describe('validateTableDefinition', () => {
  it('accepts the users example', () => {
    expect(validateTableDefinition(loadUsersExample())).toEqual([])
  })

  it('accepts free-form dataType strings', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'users',
        columns: [{ name: 'id', dataType: 'text' }],
      }),
    ).toEqual([])
  })

  it('rejects decimal without precision via JSON Schema', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'users',
      columns: [{ name: 'amount', dataType: 'decimal', scale: 2 }],
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects unknown primary key via semantic validation', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'users',
      primaryKey: ['missing'],
      columns: [{ name: 'id', dataType: 'bigint' }],
    })
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/primaryKey/0',
          message: 'unknown column "missing"',
        }),
      ]),
    )
  })

  it('rejects scale greater than precision via semantic validation', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'users',
      columns: [{ name: 'amount', dataType: 'decimal', precision: 3, scale: 5 }],
    })
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/columns/0/scale',
        }),
      ]),
    )
  })

  it('accepts rowversion column', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'orders',
        columns: [{ name: 'rowVer', dataType: 'rowversion', notNull: true }],
      }),
    ).toEqual([])
  })

  it('accepts length max on nvarchar', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'orders',
        columns: [{ name: 'note', dataType: 'nvarchar', length: 'max' }],
      }),
    ).toEqual([])
  })

  it('accepts identity on int column', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'orders',
        columns: [{ name: 'id', dataType: 'int', identity: true, notNull: true }],
      }),
    ).toEqual([])
  })

  it('accepts computed column dataType', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'orders',
        columns: [
          { name: 'qty', dataType: 'int', notNull: true },
          { name: 'price', dataType: 'decimal', precision: 18, scale: 2, notNull: true },
          {
            name: 'total',
            dataType: 'decimal(18,2) AS ([qty]*[price]) PERSISTED',
          },
        ],
      }),
    ).toEqual([])
  })

  it('accepts uniqueIndexes', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'orders',
        columns: [
          { name: 'customerId', dataType: 'int', notNull: true },
          { name: 'orderNo', dataType: 'nvarchar', length: 50, notNull: true },
        ],
        uniqueIndexes: [
          {
            keys: [
              { column: 'customerId', order: 'asc' },
              { column: 'orderNo' },
            ],
          },
        ],
      }),
    ).toEqual([])
  })

  it('rejects more than 3 uniqueIndexes via JSON Schema', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'orders',
      columns: [
        { name: 'a', dataType: 'int' },
        { name: 'b', dataType: 'int' },
        { name: 'c', dataType: 'int' },
        { name: 'd', dataType: 'int' },
      ],
      uniqueIndexes: [
        { keys: [{ column: 'a' }] },
        { keys: [{ column: 'b' }] },
        { keys: [{ column: 'c' }] },
        { keys: [{ column: 'd' }] },
      ],
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('accepts uniqueConstraints', () => {
    expect(
      validateTableDefinition({
        schemaVersion: 1,
        name: 'orders',
        columns: [
          { name: 'customerId', dataType: 'int', notNull: true },
          { name: 'orderNo', dataType: 'nvarchar', length: 50, notNull: true },
        ],
        uniqueConstraints: [{ columns: ['customerId', 'orderNo'] }],
      }),
    ).toEqual([])
  })

  it('rejects multiple identity columns via semantic validation', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'orders',
      columns: [
        { name: 'id', dataType: 'int', identity: true },
        { name: 'seq', dataType: 'bigint', identity: true },
      ],
    })
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/columns/1/identity',
        }),
      ]),
    )
  })

  it('rejects unknown column in uniqueConstraints via semantic validation', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'orders',
      columns: [{ name: 'id', dataType: 'int' }],
      uniqueConstraints: [{ columns: ['id', 'missing'] }],
    })
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/uniqueConstraints/0/columns/1',
          message: 'unknown column "missing"',
        }),
      ]),
    )
  })

  it('rejects more than 3 uniqueConstraints via JSON Schema', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'orders',
      columns: [
        { name: 'a', dataType: 'int' },
        { name: 'b', dataType: 'int' },
        { name: 'c', dataType: 'int' },
        { name: 'd', dataType: 'int' },
        { name: 'e', dataType: 'int' },
      ],
      uniqueConstraints: [
        { columns: ['a', 'b'] },
        { columns: ['a', 'c'] },
        { columns: ['a', 'd'] },
        { columns: ['a', 'e'] },
      ],
    })
    expect(errors.length).toBeGreaterThan(0)
  })
})
