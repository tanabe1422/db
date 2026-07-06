import { describe, expect, it, vi } from 'vitest'

import {
  reportBatchProgress,
  shouldShowBatchProgress,
} from './batchProgress'

describe('shouldShowBatchProgress', () => {
  it('returns true when total is greater than 1', () => {
    expect(shouldShowBatchProgress(2)).toBe(true)
    expect(shouldShowBatchProgress(10)).toBe(true)
  })

  it('returns false when total is 1 or less', () => {
    expect(shouldShowBatchProgress(1)).toBe(false)
    expect(shouldShowBatchProgress(0)).toBe(false)
  })
})

describe('reportBatchProgress', () => {
  it('calls handler when total is greater than 1', () => {
    const handler = vi.fn()
    const progress = { current: 1, total: 3, label: 'a.table.json' }

    reportBatchProgress(handler, progress)

    expect(handler).toHaveBeenCalledWith(progress)
  })

  it('does not call handler when total is 1', () => {
    const handler = vi.fn()

    reportBatchProgress(handler, { current: 1, total: 1 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call handler when handler is undefined', () => {
    expect(() =>
      reportBatchProgress(undefined, { current: 1, total: 3 }),
    ).not.toThrow()
  })
})
