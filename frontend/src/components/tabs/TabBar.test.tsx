// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import type { WorkspaceTab } from '../../types/workspaceTab'
import { TabBar } from './TabBar'

afterEach(() => {
  cleanup()
})

function makeTabs(count: number): WorkspaceTab[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tab-${i}`,
    kind: 'file' as const,
    path: `/tmp/file-${i}.table.json`,
  }))
}

describe('TabBar wheel vs zoom', () => {
  it('does not hijack Ctrl+wheel for horizontal scroll', () => {
    const { container } = render(
      <TabBar
        tabs={makeTabs(8)}
        activeTabId="tab-0"
        dirtyPaths={new Set()}
        activeDirectory="/tmp"
        onActivate={() => undefined}
        onClose={() => undefined}
        onCloseAllSaved={() => undefined}
      />,
    )

    const bar = container.querySelector('[role="tablist"]') as HTMLDivElement
    Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 800 })
    Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 200 })
    bar.scrollLeft = 0

    const preventDefault = vi.fn()
    const event = new WheelEvent('wheel', {
      deltaY: 40,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(event, 'preventDefault', { value: preventDefault })
    bar.dispatchEvent(event)

    expect(bar.scrollLeft).toBe(0)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('still scrolls horizontally without Ctrl', () => {
    const { container } = render(
      <TabBar
        tabs={makeTabs(8)}
        activeTabId="tab-0"
        dirtyPaths={new Set()}
        activeDirectory="/tmp"
        onActivate={() => undefined}
        onClose={() => undefined}
        onCloseAllSaved={() => undefined}
      />,
    )

    const bar = container.querySelector('[role="tablist"]') as HTMLDivElement
    Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 800 })
    Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 200 })
    bar.scrollLeft = 0

    bar.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 40,
        ctrlKey: false,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(bar.scrollLeft).toBe(40)
  })
})
