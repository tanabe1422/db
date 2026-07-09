// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'

import { useDirectoryScan } from './useDirectoryScan'

const eventsOn = vi.fn(() => () => undefined)
const scanActiveDirectory = vi.fn().mockResolvedValue(null)
const startDirectoryWatch = vi.fn().mockResolvedValue(undefined)
const isWailsRuntime = vi.fn(() => false)

vi.mock('../../wailsjs/runtime/runtime', () => ({
  EventsOn: (...args: unknown[]) => eventsOn(...args),
}))

vi.mock('../lib/wails', () => ({
  isWailsRuntime: () => isWailsRuntime(),
  scanActiveDirectory: (...args: unknown[]) => scanActiveDirectory(...args),
  startDirectoryWatch: (...args: unknown[]) => startDirectoryWatch(...args),
}))

afterEach(() => {
  cleanup()
  eventsOn.mockClear()
  scanActiveDirectory.mockClear()
  startDirectoryWatch.mockClear()
  isWailsRuntime.mockReset()
  isWailsRuntime.mockReturnValue(false)
})

describe('useDirectoryScan', () => {
  it('does not subscribe to EventsOn outside Wails (Storybook/browser)', async () => {
    isWailsRuntime.mockReturnValue(false)
    renderHook(() => useDirectoryScan('/tmp/project'))

    await waitFor(() => {
      expect(scanActiveDirectory).toHaveBeenCalled()
    })
    expect(eventsOn).not.toHaveBeenCalled()
  })

  it('subscribes to directory:changed under Wails', async () => {
    isWailsRuntime.mockReturnValue(true)
    renderHook(() => useDirectoryScan('/tmp/project'))

    await waitFor(() => {
      expect(eventsOn).toHaveBeenCalledWith('directory:changed', expect.any(Function))
    })
  })
})
