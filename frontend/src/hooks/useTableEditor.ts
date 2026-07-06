import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { errorMessage } from '../lib/errorMessage'
import { writeTableFile } from '../lib/wails'
import type { FlagField } from '../lib/gridColumns'
import {
  type DraftColumn,
  type DraftTable,
  type MarkerField,
  createEmptyDraftColumn,
  serialize,
  toDraft,
} from '../utils/serializeTable'

export type { FlagField } from '../lib/gridColumns'

export type EditableField =
  | 'name'
  | 'nameJa'
  | 'dataType'
  | 'length'
  | 'precision'
  | 'scale'
  | 'defaultValue'
  | 'remarks'

export type MetaField = 'name' | 'nameJa' | 'description'

interface SaveResult {
  ok: boolean
  error?: string
}

export interface TableEditor {
  draft: DraftTable
  dirty: boolean
  saving: boolean
  saveError: string | null
  canUndo: boolean
  canRedo: boolean
  selectedRowIds: Set<number>
  clipboardCount: number
  updateMeta: (field: MetaField, value: string) => void
  updateCell: (rowId: number, field: EditableField, value: string) => void
  toggleFlag: (rowId: number, field: FlagField) => void
  updateMarker: (
    rowId: number,
    field: MarkerField,
    position: number,
    value: string,
  ) => void
  moveRowUp: (rowId: number) => void
  moveRowDown: (rowId: number) => void
  deleteRow: (rowId: number) => void
  addRowBelow: (rowId: number) => void
  pasteBelow: (rowId: number) => void
  selectRow: (rowId: number) => void
  toggleRow: (rowId: number) => void
  selectRange: (rowId: number) => void
  copySelected: () => void
  undo: () => void
  redo: () => void
  save: () => Promise<SaveResult>
}

function cloneColumn(column: DraftColumn, rowId: number): DraftColumn {
  return {
    ...column,
    rowId,
    markers: [...column.markers],
    uniqueIndexMarkers: [...column.uniqueIndexMarkers],
    uniqueMarkers: [...column.uniqueMarkers],
  }
}

export function useTableEditor(
  definition: TableDefinition | null,
  path: string,
): TableEditor | null {
  const rowIdRef = useRef(0)
  const nextRowId = useCallback(() => {
    rowIdRef.current += 1
    return rowIdRef.current
  }, [])

  const [draft, setDraft] = useState<DraftTable | null>(null)
  const [savedDraft, setSavedDraft] = useState<DraftTable | null>(null)
  const [past, setPast] = useState<DraftTable[]>([])
  const [future, setFuture] = useState<DraftTable[]>([])
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set())
  const [anchorRowId, setAnchorRowId] = useState<number | null>(null)
  const [clipboard, setClipboard] = useState<DraftColumn[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!definition) {
      setDraft(null)
      setSavedDraft(null)
      setPast([])
      setFuture([])
      setSelectedRowIds(new Set())
      setAnchorRowId(null)
      return
    }
    rowIdRef.current = 0
    const initial = toDraft(definition, nextRowId)
    setDraft(initial)
    setSavedDraft(initial)
    setPast([])
    setFuture([])
    setSelectedRowIds(new Set())
    setAnchorRowId(null)
    setSaveError(null)
  }, [definition, path, nextRowId])

  const commit = useCallback(
    (updater: (current: DraftTable) => DraftTable) => {
      setDraft((current) => {
        if (!current) {
          return current
        }
        const next = updater(current)
        if (next === current) {
          return current
        }
        setPast((stack) => [...stack, current])
        setFuture([])
        return next
      })
    },
    [],
  )

  const updateColumns = useCallback(
    (updater: (columns: DraftColumn[]) => DraftColumn[]) => {
      commit((current) => {
        const nextColumns = updater(current.columns)
        if (nextColumns === current.columns) {
          return current
        }
        return { ...current, columns: nextColumns }
      })
    },
    [commit],
  )

  const updateMeta = useCallback(
    (field: MetaField, value: string) => {
      commit((current) =>
        current[field] === value ? current : { ...current, [field]: value },
      )
    },
    [commit],
  )

  const updateCell = useCallback(
    (rowId: number, field: EditableField, value: string) => {
      updateColumns((columns) => {
        let changed = false
        const next = columns.map((column) => {
          if (column.rowId !== rowId || column[field] === value) {
            return column
          }
          changed = true
          return { ...column, [field]: value }
        })
        return changed ? next : columns
      })
    },
    [updateColumns],
  )

  const toggleFlag = useCallback(
    (rowId: number, field: FlagField) => {
      updateColumns((columns) =>
        columns.map((column) =>
          column.rowId === rowId
            ? { ...column, [field]: !column[field] }
            : column,
        ),
      )
    },
    [updateColumns],
  )

  const updateMarker = useCallback(
    (rowId: number, field: MarkerField, position: number, value: string) => {
      updateColumns((columns) => {
        let changed = false
        const next = columns.map((column) => {
          if (column.rowId !== rowId || column[field][position] === value) {
            return column
          }
          changed = true
          const markers = [...column[field]]
          markers[position] = value
          return { ...column, [field]: markers }
        })
        return changed ? next : columns
      })
    },
    [updateColumns],
  )

  const moveRowUp = useCallback(
    (rowId: number) => {
      updateColumns((columns) => {
        const index = columns.findIndex((column) => column.rowId === rowId)
        if (index <= 0) {
          return columns
        }
        const next = [...columns]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        return next
      })
    },
    [updateColumns],
  )

  const moveRowDown = useCallback(
    (rowId: number) => {
      updateColumns((columns) => {
        const index = columns.findIndex((column) => column.rowId === rowId)
        if (index < 0 || index >= columns.length - 1) {
          return columns
        }
        const next = [...columns]
        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        return next
      })
    },
    [updateColumns],
  )

  const deleteRow = useCallback(
    (rowId: number) => {
      updateColumns((columns) =>
        columns.length <= 1
          ? columns
          : columns.filter((column) => column.rowId !== rowId),
      )
      setSelectedRowIds((current) => {
        if (!current.has(rowId)) {
          return current
        }
        const next = new Set(current)
        next.delete(rowId)
        return next
      })
    },
    [updateColumns],
  )

  const addRowBelow = useCallback(
    (rowId: number) => {
      updateColumns((columns) => {
        const index = columns.findIndex((column) => column.rowId === rowId)
        const next = [...columns]
        const newColumn = createEmptyDraftColumn(nextRowId())
        next.splice(index + 1, 0, newColumn)
        return next
      })
    },
    [updateColumns, nextRowId],
  )

  const pasteBelow = useCallback(
    (rowId: number) => {
      if (clipboard.length === 0) {
        return
      }
      updateColumns((columns) => {
        const index = columns.findIndex((column) => column.rowId === rowId)
        const inserted = clipboard.map((column) =>
          cloneColumn(column, nextRowId()),
        )
        const next = [...columns]
        next.splice(index + 1, 0, ...inserted)
        return next
      })
    },
    [clipboard, updateColumns, nextRowId],
  )

  const selectRow = useCallback((rowId: number) => {
    setSelectedRowIds(new Set([rowId]))
    setAnchorRowId(rowId)
  }, [])

  const toggleRow = useCallback((rowId: number) => {
    setSelectedRowIds((current) => {
      const next = new Set(current)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
    setAnchorRowId(rowId)
  }, [])

  const selectRange = useCallback(
    (rowId: number) => {
      setDraft((current) => {
        if (!current) {
          return current
        }
        const ids = current.columns.map((column) => column.rowId)
        const targetIndex = ids.indexOf(rowId)
        const anchorIndex = anchorRowId == null ? -1 : ids.indexOf(anchorRowId)
        if (targetIndex < 0) {
          return current
        }
        if (anchorIndex < 0) {
          setSelectedRowIds(new Set([rowId]))
          setAnchorRowId(rowId)
          return current
        }
        const start = Math.min(anchorIndex, targetIndex)
        const end = Math.max(anchorIndex, targetIndex)
        setSelectedRowIds(new Set(ids.slice(start, end + 1)))
        return current
      })
    },
    [anchorRowId],
  )

  const copySelected = useCallback(() => {
    setDraft((current) => {
      if (!current) {
        return current
      }
      const copied = current.columns
        .filter((column) => selectedRowIds.has(column.rowId))
        .map((column) => cloneColumn(column, column.rowId))
      if (copied.length > 0) {
        setClipboard(copied)
      }
      return current
    })
  }, [selectedRowIds])

  const undo = useCallback(() => {
    setPast((stack) => {
      if (stack.length === 0) {
        return stack
      }
      const previous = stack[stack.length - 1]
      setDraft((current) => {
        if (current) {
          setFuture((f) => [current, ...f])
        }
        return previous
      })
      return stack.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((stack) => {
      if (stack.length === 0) {
        return stack
      }
      const next = stack[0]
      setDraft((current) => {
        if (current) {
          setPast((p) => [...p, current])
        }
        return next
      })
      return stack.slice(1)
    })
  }, [])

  const save = useCallback(async (): Promise<SaveResult> => {
    if (!draft || !path) {
      return { ok: false, error: 'no file' }
    }
    setSaving(true)
    setSaveError(null)
    try {
      await writeTableFile(path, serialize(draft))
      setSavedDraft(draft)
      setSaving(false)
      return { ok: true }
    } catch (err) {
      const message = errorMessage(err, '保存に失敗しました')
      setSaveError(message)
      setSaving(false)
      return { ok: false, error: message }
    }
  }, [draft, path])

  return useMemo(() => {
    if (!draft) {
      return null
    }
    return {
      draft,
      dirty: savedDraft != null && serialize(draft) !== serialize(savedDraft),
      saving,
      saveError,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      selectedRowIds,
      clipboardCount: clipboard.length,
      updateMeta,
      updateCell,
      toggleFlag,
      updateMarker,
      moveRowUp,
      moveRowDown,
      deleteRow,
      addRowBelow,
      pasteBelow,
      selectRow,
      toggleRow,
      selectRange,
      copySelected,
      undo,
      redo,
      save,
    }
  }, [
    draft,
    savedDraft,
    saving,
    saveError,
    past.length,
    future.length,
    selectedRowIds,
    clipboard.length,
    updateMeta,
    updateCell,
    toggleFlag,
    updateMarker,
    moveRowUp,
    moveRowDown,
    deleteRow,
    addRowBelow,
    pasteBelow,
    selectRow,
    toggleRow,
    selectRange,
    copySelected,
    undo,
    redo,
    save,
  ])
}
