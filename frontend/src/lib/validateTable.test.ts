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

  it('rejects unknown dataType via JSON Schema', () => {
    const errors = validateTableDefinition({
      schemaVersion: 1,
      name: 'users',
      columns: [{ name: 'id', dataType: 'text' }],
    })
    expect(errors.length).toBeGreaterThan(0)
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
})
