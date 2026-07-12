// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { KeyboardEvent } from 'react'

import type { TableEditor } from '../../hooks/useTableEditor'
import {
  createEmptyDraftColumn,
  type DraftColumn,
  type DraftTable,
} from '../../utils/serializeTable'
import { NAV_COLS } from './navColumns'
import { useGridNavigation } from './useGridNavigation'

afterEach(() => {
  cleanup()
})

function makeColumn(
  rowId: number,
  overrides: Partial<DraftColumn> = {},
): DraftColumn {
  return {
    ...createEmptyDraftColumn(rowId),
    name: `col_${rowId}`,
    nameJa: `列${rowId}`,
    ...overrides,
  }
}

function makeDraft(columns: DraftColumn[]): DraftTable {
  return {
    schemaVersion: 1,
    name: 't',
    nameJa: 'テーブル',
    description: '',
    extra: {},
    columns,
  }
}

function makeEditor(draft: DraftTable): TableEditor {
  return {
    draft,
    dirty: false,
    saving: false,
    saveError: null,
    canUndo: false,
    canRedo: false,
    selectedRowIds: new Set(),
    clipboardCount: 0,
    updateMeta: vi.fn(),
    updateCell: vi.fn(),
    toggleFlag: vi.fn(),
    updateMarker: vi.fn(),
    moveRowUp: vi.fn(),
    moveRowDown: vi.fn(),
    deleteRow: vi.fn(),
    addRowBelow: vi.fn(),
    pasteBelow: vi.fn(),
    selectRow: vi.fn(),
    toggleRow: vi.fn(),
    selectRange: vi.fn(),
    clearRowSelection: vi.fn(),
    copySelected: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    save: vi.fn(async () => ({ ok: true })),
  }
}

type KeyInit = {
  shiftKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  target?: HTMLElement
}

function keyEvent(
  key: string,
  init: KeyInit = {},
): KeyboardEvent<HTMLDivElement> {
  const ctrlKey = init.ctrlKey ?? false
  const metaKey = init.metaKey ?? false
  const shiftKey = init.shiftKey ?? false
  return {
    key,
    ctrlKey,
    metaKey,
    shiftKey,
    preventDefault: vi.fn(),
    getModifierState: (mod: string) => {
      if (mod === 'Control') {
        return ctrlKey
      }
      if (mod === 'Meta') {
        return metaKey
      }
      return false
    },
    target: init.target ?? document.createElement('div'),
  } as unknown as KeyboardEvent<HTMLDivElement>
}

function setup(columns = [makeColumn(1), makeColumn(2)]) {
  const editor = makeEditor(makeDraft(columns))
  const hook = renderHook(() => useGridNavigation(editor))
  return { editor, ...hook }
}

describe('useGridNavigation', () => {
  describe('Tab / Shift+Tab', () => {
    it('未選択時 Tab で先頭セルを選択する', () => {
      const { result } = setup()

      act(() => {
        result.current.handleKeyDown(keyEvent('Tab'))
      })

      expect(result.current.active).toEqual({
        rowId: 1,
        colId: NAV_COLS[0].id,
      })
      expect(result.current.editing).toBe(false)
    })

    it('Tab で次のセルへ、Shift+Tab で前のセルへ移動する', () => {
      const { result } = setup()

      act(() => {
        result.current.activateCell(1, NAV_COLS[0].id)
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('Tab'))
      })

      expect(result.current.active).toEqual({
        rowId: 1,
        colId: NAV_COLS[1].id,
      })

      act(() => {
        result.current.handleKeyDown(keyEvent('Tab', { shiftKey: true }))
      })

      expect(result.current.active).toEqual({
        rowId: 1,
        colId: NAV_COLS[0].id,
      })
    })

    it('最終セルで Tab しても active は変わらない', () => {
      const { result } = setup([makeColumn(1)])
      const lastCol = NAV_COLS[NAV_COLS.length - 1].id

      act(() => {
        result.current.activateCell(1, lastCol)
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('Tab'))
      })

      expect(result.current.active).toEqual({ rowId: 1, colId: lastCol })
    })
  })

  describe('矢印キー', () => {
    it('上下左右でセル移動する', () => {
      const { result } = setup()

      act(() => {
        result.current.activateCell(1, 'name')
      })

      act(() => {
        result.current.handleKeyDown(keyEvent('ArrowRight'))
      })
      expect(result.current.active).toEqual({ rowId: 1, colId: 'nameJa' })

      act(() => {
        result.current.handleKeyDown(keyEvent('ArrowLeft'))
      })
      expect(result.current.active).toEqual({ rowId: 1, colId: 'name' })

      act(() => {
        result.current.handleKeyDown(keyEvent('ArrowDown'))
      })
      expect(result.current.active).toEqual({ rowId: 2, colId: 'name' })

      act(() => {
        result.current.handleKeyDown(keyEvent('ArrowUp'))
      })
      expect(result.current.active).toEqual({ rowId: 1, colId: 'name' })
    })

    it('編集中は左右を無視し、上下はセル移動する', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.startEdit(1, 'name')
      })
      expect(result.current.editing).toBe(true)

      act(() => {
        result.current.handleKeyDown(keyEvent('ArrowRight'))
      })
      expect(result.current.active).toEqual({ rowId: 1, colId: 'name' })
      expect(result.current.editing).toBe(true)
      expect(editor.updateCell).not.toHaveBeenCalled()

      act(() => {
        result.current.handleKeyDown(keyEvent('ArrowDown'))
      })
      expect(result.current.active).toEqual({ rowId: 2, colId: 'name' })
      expect(result.current.editing).toBe(false)
      expect(editor.updateCell).toHaveBeenCalledWith(1, 'name', 'col_1')
    })
  })

  describe('Enter', () => {
    it('未編集時 Enter で編集を開始する', () => {
      const { result } = setup()

      act(() => {
        result.current.activateCell(1, 'name')
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('Enter'))
      })

      expect(result.current.editing).toBe(true)
      expect(result.current.editValue).toBe('col_1')
    })

    it('check 列で Enter すると toggleFlag する', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.activateCell(1, 'pk')
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('Enter'))
      })

      expect(editor.toggleFlag).toHaveBeenCalledWith(1, 'pk')
      expect(result.current.editing).toBe(false)
    })

    it('編集中 Enter で確定して編集を終了する', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.startEdit(1, 'name')
        result.current.setEditValue('renamed')
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('Enter'))
      })

      expect(editor.updateCell).toHaveBeenCalledWith(1, 'name', 'renamed')
      expect(result.current.editing).toBe(false)
    })
  })

  describe('Escape', () => {
    it('編集をキャンセルし値を flush しない', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.startEdit(1, 'name')
        result.current.setEditValue('discarded')
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('Escape'))
      })

      expect(result.current.editing).toBe(false)
      expect(result.current.active).toEqual({ rowId: 1, colId: 'name' })
      expect(editor.updateCell).not.toHaveBeenCalled()
    })
  })

  describe('スペース（check 列）', () => {
    it('スペースで toggleFlag する', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.activateCell(1, 'nn')
      })
      act(() => {
        result.current.handleKeyDown(keyEvent(' '))
      })

      expect(editor.toggleFlag).toHaveBeenCalledWith(1, 'notNull')
    })
  })

  describe('文字キー', () => {
    it('1文字入力で編集を開始し、その文字を初期値にする', () => {
      const { result } = setup()

      act(() => {
        result.current.activateCell(1, 'name')
      })
      act(() => {
        result.current.handleKeyDown(keyEvent('a'))
      })

      expect(result.current.editing).toBe(true)
      expect(result.current.editValue).toBe('a')
    })
  })

  describe('Undo / Redo', () => {
    it('Ctrl+Z で undo、Ctrl+Y で redo する', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.handleKeyDown(keyEvent('z', { ctrlKey: true }))
      })
      expect(editor.undo).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.handleKeyDown(keyEvent('y', { ctrlKey: true }))
      })
      expect(editor.redo).toHaveBeenCalledTimes(1)
    })

    it('Ctrl+Shift+Z で redo する', () => {
      const { result, editor } = setup()

      act(() => {
        result.current.handleKeyDown(
          keyEvent('z', { ctrlKey: true, shiftKey: true }),
        )
      })
      expect(editor.redo).toHaveBeenCalledTimes(1)
    })
  })
})
