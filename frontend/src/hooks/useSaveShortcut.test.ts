// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'

import { useSaveShortcut } from './useSaveShortcut'

afterEach(() => {
  cleanup()
})

describe('useSaveShortcut', () => {
  it('Ctrl+S で onSave を呼ぶ', () => {
    const onSave = vi.fn()
    renderHook(() => useSaveShortcut(true, onSave))

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }),
    )

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disabled のときは onSave を呼ばない', () => {
    const onSave = vi.fn()
    renderHook(() => useSaveShortcut(false, onSave))

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }),
    )

    expect(onSave).not.toHaveBeenCalled()
  })
})
