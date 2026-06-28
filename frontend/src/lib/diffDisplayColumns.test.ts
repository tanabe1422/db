import { describe, expect, it } from 'vitest'

import type { ColumnDiffRow } from './diffTable'
import { DISPLAY_COLS, diffCellHighlight } from './diffDisplayColumns'

function row(overrides: Partial<ColumnDiffRow> & Pick<ColumnDiffRow, 'status'>): ColumnDiffRow {
  return {
    name: 'col1',
    changed: new Set(),
    ...overrides,
  }
}

describe('DISPLAY_COLS', () => {
  it('derives columns from GRID_COLUMNS', () => {
    expect(DISPLAY_COLS.length).toBeGreaterThan(0)
    expect(DISPLAY_COLS[0]).toMatchObject({ id: 'pk', kind: 'check' })
    expect(DISPLAY_COLS.find((c) => c.id === 'name')).toMatchObject({
      kind: 'text',
    })
    expect(DISPLAY_COLS.find((c) => c.id === 'len')).toMatchObject({
      kind: 'num',
    })
  })
})

describe('diffCellHighlight', () => {
  it('returns changed when cell is in changed set', () => {
    const r = row({ status: 'changed', changed: new Set(['name']) })
    expect(diffCellHighlight(r, 'name', 'left')).toBe('changed')
    expect(diffCellHighlight(r, 'name', 'right')).toBe('changed')
    expect(diffCellHighlight(r, 'dataType', 'left')).toBeNull()
  })

  it('returns added on right side for added rows', () => {
    const r = row({ status: 'added' })
    expect(diffCellHighlight(r, 'name', 'right')).toBe('added')
    expect(diffCellHighlight(r, 'name', 'left')).toBeNull()
  })

  it('returns removed on left side for removed rows', () => {
    const r = row({ status: 'removed' })
    expect(diffCellHighlight(r, 'name', 'left')).toBe('removed')
    expect(diffCellHighlight(r, 'name', 'right')).toBeNull()
  })

  it('returns null for same rows', () => {
    const r = row({ status: 'same' })
    expect(diffCellHighlight(r, 'name', 'left')).toBeNull()
  })
})
