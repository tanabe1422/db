// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'

import {
  RESIZE_SYNC_DEBOUNCE_MS,
  syncRowHeights,
  useSyncedTableRowHeights,
} from './useSyncedTableRowHeights'

const SIDEBAR_TRANSITION_MS = 180
const FRAMES_DURING_TRANSITION = Math.ceil(SIDEBAR_TRANSITION_MS / (1000 / 60))

type ObserverCallback = ResizeObserverCallback

class MockResizeObserver {
  static instances: MockResizeObserver[] = []
  callback: ObserverCallback
  observed = new Set<Element>()

  constructor(callback: ObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
  }

  observe(target: Element) {
    this.observed.add(target)
  }

  unobserve(target: Element) {
    this.observed.delete(target)
  }

  disconnect() {
    this.observed.clear()
  }

  emit() {
    const entries = [...this.observed].map(
      (target) => ({ target }) as ResizeObserverEntry,
    )
    this.callback(entries, this)
  }
}

function makePane(rowCount: number, cellText = 'cell'): HTMLDivElement {
  const root = document.createElement('div')
  const table = document.createElement('table')
  const tbody = document.createElement('tbody')
  for (let i = 0; i < rowCount; i++) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.textContent = `${cellText}-${i}`
    tr.appendChild(td)
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  root.appendChild(table)
  document.body.appendChild(root)
  return root
}

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
  MockResizeObserver.instances = []
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('syncRowHeights cost (verify transition / row-sync / prod model)', () => {
  it('transition-length burst is many syncs vs one settle sync', () => {
    const left = makePane(100, 'L')
    const right = makePane(100, 'R longer content')

    let calls = 0
    const counted = (
      a: HTMLDivElement | null,
      b: HTMLDivElement | null,
    ) => {
      calls += 1
      syncRowHeights(a, b)
    }

    for (let i = 0; i < FRAMES_DURING_TRANSITION; i++) {
      counted(left, right)
    }
    expect(calls).toBe(FRAMES_DURING_TRANSITION)

    calls = 0
    counted(left, right)
    expect(calls).toBe(1)
    expect(FRAMES_DURING_TRANSITION).toBeGreaterThanOrEqual(10)
  })

  it('is pure DOM work independent of React DEV / StrictMode', () => {
    const left = makePane(100)
    const right = makePane(100, 'taller')
    syncRowHeights(left, right)
    const leftH = left.querySelector<HTMLTableRowElement>('tbody tr')?.style.height
    const rightH = right.querySelector<HTMLTableRowElement>('tbody tr')?.style.height
    expect(leftH).toBeTruthy()
    expect(leftH).toBe(rightH)
  })
})

describe('useSyncedTableRowHeights', () => {
  beforeEach(() => {
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    // Keep our rAF stub; only fake debounce timers.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  it('syncs immediately on mount, then only once after a resize burst settles', () => {
    const left = makePane(5, 'L')
    const right = makePane(5, 'Rx')
    const leftRef = { current: left }
    const rightRef = { current: right }

    let rowOffsetReads = 0
    const originalDesc = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    )
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        if ((this as HTMLElement).tagName === 'TR') {
          rowOffsetReads += 1
        }
        return 24
      },
    })

    try {
      renderHook(() => useSyncedTableRowHeights(leftRef, rightRef, [left]))

      // Immediate rAF sync reads each of 5 left + 5 right rows once.
      expect(rowOffsetReads).toBe(10)
      rowOffsetReads = 0

      const observer = MockResizeObserver.instances[0]
      expect(observer).toBeTruthy()

      for (let i = 0; i < FRAMES_DURING_TRANSITION; i++) {
        observer.emit()
      }
      expect(rowOffsetReads).toBe(0)

      vi.advanceTimersByTime(RESIZE_SYNC_DEBOUNCE_MS - 1)
      expect(rowOffsetReads).toBe(0)

      vi.advanceTimersByTime(1)
      expect(rowOffsetReads).toBe(10)
    } finally {
      if (originalDesc) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalDesc)
      } else {
        delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight
      }
    }
  })
})
