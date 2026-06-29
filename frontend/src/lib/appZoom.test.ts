// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import {
  computeTooltipHorizontalPosition,
  computeTooltipPosition,
  levelToFactor,
  toTooltipPosition,
} from './appZoom'

describe('appZoom', () => {
  it('converts zoom level to factor', () => {
    expect(levelToFactor(0)).toBe(1)
    expect(levelToFactor(1)).toBeCloseTo(1.2)
    expect(levelToFactor(-1)).toBeCloseTo(1 / 1.2)
  })

  it('converts trigger rect to tooltip anchor under zoom', () => {
    const rect = {
      left: 100,
      bottom: 200,
      width: 40,
    } as DOMRect

    expect(toTooltipPosition(rect, 6)).toEqual({
      top: 206,
      left: 120,
    })
  })

  it('clamps tooltip horizontally near viewport edge', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })

    const triggerRect = { top: 100, left: 4, bottom: 120, width: 24 } as DOMRect
    const tooltipRect = { width: 160, height: 32 } as DOMRect

    expect(computeTooltipPosition(triggerRect, tooltipRect)).toEqual({
      top: 126,
      left: 8,
      align: 'start',
    })
  })

  it('anchors tooltip to the end near the right viewport edge', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })

    const triggerRect = { top: 100, left: 360, bottom: 120, width: 32 } as DOMRect
    const tooltipRect = { width: 160, height: 32 } as DOMRect

    expect(computeTooltipPosition(triggerRect, tooltipRect)).toEqual({
      top: 126,
      left: 392,
      align: 'end',
    })
  })

  it('prefers start alignment near the left viewport edge', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })

    expect(
      computeTooltipHorizontalPosition(
        { left: 4, width: 24 } as DOMRect,
        160,
      ),
    ).toEqual({ left: 8, align: 'start' })

    expect(
      computeTooltipHorizontalPosition(
        { left: 4, width: 24 } as DOMRect,
        200,
      ),
    ).toEqual({ left: 8, align: 'start' })
  })

  it('flips tooltip above trigger when below viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 200 })

    const triggerRect = { top: 150, left: 300, bottom: 170, width: 40 } as DOMRect
    const tooltipRect = { width: 120, height: 40 } as DOMRect

    expect(computeTooltipPosition(triggerRect, tooltipRect)).toEqual({
      top: 104,
      left: 320,
      align: 'center',
    })
  })
})
