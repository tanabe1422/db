import { describe, expect, it } from 'vitest'

import { levelToFactor } from './appZoom'

describe('appZoom', () => {
  it('converts zoom level to factor', () => {
    expect(levelToFactor(0)).toBe(1)
    expect(levelToFactor(1)).toBeCloseTo(1.2)
    expect(levelToFactor(-1)).toBeCloseTo(1 / 1.2)
  })
})
