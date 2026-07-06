import { useEffect, useMemo, useRef, useState } from 'react'

import { isDecimal } from '../../utils/columnMeta'
import { cellValue, flagFor, markerFieldFor, markerPosition } from '../../lib/gridColumns'
import { cleanDefinition, type DraftColumn } from '../../utils/serializeTable'
import {
  validateTableDefinition,
  type ValidationError,
} from '../../lib/validateTable'
import type { EditableField, TableEditor } from '../../hooks/useTableEditor'
import { NAV_COLS, colKind } from './navColumns'

export interface ActiveCell {
  rowId: number
  colId: string
}

export interface GridNavigation {
  containerRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.MutableRefObject<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  >
  active: ActiveCell | null
  editing: boolean
  editValue: string
  setEditValue: (value: string) => void
  validationVisible: boolean
  errors: ValidationError[]
  handleSave: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  handleContainerBlur: (e: React.FocusEvent<HTMLDivElement>) => void
  handleRowSelect: (e: React.MouseEvent, rowId: number) => void
  startEdit: (
    rowId: number,
    colId: string,
    initial?: string,
    selectAll?: boolean,
    options?: { openCombobox?: boolean },
  ) => void
  takeComboboxOpenRequest: () => boolean
  activateCell: (rowId: number, colId: string) => void
  stopEditing: () => void
}

// 編集グリッドのセル選択・編集・キーボード操作の状態機械をまとめる。
export function useGridNavigation(editor: TableEditor): GridNavigation {
  const [active, setActive] = useState<ActiveCell | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [validationVisible, setValidationVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  >(null)
  // 編集開始時にテキストを全選択するか（Enter/文字入力起点）、
  // 末尾キャレットのみにするか（クリック起点）を切り替える。
  const selectAllRef = useRef(true)
  const comboboxOpenRequestRef = useRef(false)

  const errors = useMemo(
    () => validateTableDefinition(cleanDefinition(editor.draft)),
    [editor.draft],
  )

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (
        inputRef.current instanceof HTMLInputElement ||
        inputRef.current instanceof HTMLTextAreaElement
      ) {
        if (selectAllRef.current) {
          inputRef.current.select()
        } else {
          const end = inputRef.current.value.length
          inputRef.current.setSelectionRange(end, end)
        }
      }
    }
  }, [editing, active])

  // エラーが解消されたら検証メッセージを隠す。
  useEffect(() => {
    if (errors.length === 0) {
      setValidationVisible(false)
    }
  }, [errors.length])

  function handleSave() {
    if (errors.length > 0) {
      setValidationVisible(true)
      return
    }
    setValidationVisible(false)
    void editor.save()
  }

  const columns = editor.draft.columns

  const columnById = (rowId: number): DraftColumn | undefined =>
    columns.find((c) => c.rowId === rowId)

  function setCellValue(
    rowId: number,
    column: DraftColumn,
    colId: string,
    value: string,
  ) {
    const markerField = markerFieldFor(colId)
    const position = markerPosition(colId)
    if (markerField != null && position != null) {
      editor.updateMarker(rowId, markerField, position, value)
      return
    }
    if (colId === 'len') {
      editor.updateCell(
        rowId,
        isDecimal(column.dataType) ? 'precision' : 'length',
        value,
      )
      return
    }
    const field: EditableField =
      colId === 'default' ? 'defaultValue' : (colId as EditableField)
    editor.updateCell(rowId, field, value)
  }

  function flushEdit() {
    if (!editing || !active) {
      return
    }
    if (colKind(active.colId) === 'check') {
      return
    }
    const column = columnById(active.rowId)
    if (column) {
      setCellValue(active.rowId, column, active.colId, editValue)
    }
  }

  function deactivateCell() {
    flushEdit()
    setActive(null)
    setEditing(false)
  }

  function activateCell(rowId: number, colId: string) {
    editor.clearRowSelection()
    flushEdit()
    setActive({ rowId, colId })
    setEditing(false)
    containerRef.current?.focus()
  }

  function startEdit(
    rowId: number,
    colId: string,
    initial?: string,
    selectAll = true,
    options?: { openCombobox?: boolean },
  ) {
    editor.clearRowSelection()
    flushEdit()
    setActive({ rowId, colId })
    const kind = colKind(colId)
    comboboxOpenRequestRef.current =
      kind === 'combobox' && (options?.openCombobox ?? false)
    if (kind === 'check') {
      editor.toggleFlag(rowId, flagFor(colId))
      setEditing(false)
      return
    }
    const column = columnById(rowId)
    selectAllRef.current = selectAll
    setEditValue(initial ?? (column ? cellValue(column, colId) : ''))
    setEditing(true)
  }

  function stopEditing() {
    setEditing(false)
  }

  function takeComboboxOpenRequest(): boolean {
    const requested = comboboxOpenRequestRef.current
    comboboxOpenRequestRef.current = false
    return requested
  }

  type MoveDirection = 'up' | 'down' | 'left' | 'right'

  function computeNext(current: ActiveCell, forward: boolean): ActiveCell | null {
    const rowIndex = columns.findIndex((c) => c.rowId === current.rowId)
    const colIndex = NAV_COLS.findIndex((c) => c.id === current.colId)
    if (rowIndex < 0 || colIndex < 0) {
      return null
    }
    const total = columns.length * NAV_COLS.length
    const linear = rowIndex * NAV_COLS.length + colIndex + (forward ? 1 : -1)
    if (linear < 0 || linear >= total) {
      return null
    }
    const nextRow = Math.floor(linear / NAV_COLS.length)
    const nextCol = linear % NAV_COLS.length
    return { rowId: columns[nextRow].rowId, colId: NAV_COLS[nextCol].id }
  }

  function computeNextDirection(
    current: ActiveCell,
    direction: MoveDirection,
  ): ActiveCell | null {
    const rowIndex = columns.findIndex((c) => c.rowId === current.rowId)
    const colIndex = NAV_COLS.findIndex((c) => c.id === current.colId)
    if (rowIndex < 0 || colIndex < 0) {
      return null
    }

    let nextRow = rowIndex
    let nextCol = colIndex
    switch (direction) {
      case 'left':
        if (colIndex <= 0) {
          return null
        }
        nextCol = colIndex - 1
        break
      case 'right':
        if (colIndex >= NAV_COLS.length - 1) {
          return null
        }
        nextCol = colIndex + 1
        break
      case 'up':
        if (rowIndex <= 0) {
          return null
        }
        nextRow = rowIndex - 1
        break
      case 'down':
        if (rowIndex >= columns.length - 1) {
          return null
        }
        nextRow = rowIndex + 1
        break
    }
    return { rowId: columns[nextRow].rowId, colId: NAV_COLS[nextCol].id }
  }

  function applyActiveMove(next: ActiveCell | null, wasEditing: boolean) {
    if (!next) {
      setEditing(false)
      return
    }
    setActive(next)
    if (wasEditing && colKind(next.colId) !== 'check') {
      const column = columnById(next.rowId)
      setEditValue(column ? cellValue(column, next.colId) : '')
      setEditing(true)
    } else {
      setEditing(false)
      containerRef.current?.focus()
    }
  }

  function moveActive(forward: boolean) {
    if (!active) {
      const first = columns[0]
      if (first) {
        setActive({ rowId: first.rowId, colId: NAV_COLS[0].id })
      }
      return
    }
    const wasEditing = editing
    flushEdit()
    applyActiveMove(computeNext(active, forward), wasEditing)
  }

  function moveActiveDirection(direction: MoveDirection) {
    if (!active) {
      const first = columns[0]
      if (first) {
        setActive({ rowId: first.rowId, colId: NAV_COLS[0].id })
      }
      return
    }
    const wasEditing = editing
    flushEdit()
    applyActiveMove(computeNextDirection(active, direction), wasEditing)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const mod = e.ctrlKey || e.metaKey
    const target = e.target as HTMLElement

    if (mod && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
      e.preventDefault()
      editor.undo()
      return
    }
    if (
      mod &&
      (e.key === 'y' ||
        e.key === 'Y' ||
        ((e.key === 'z' || e.key === 'Z') && e.shiftKey))
    ) {
      e.preventDefault()
      editor.redo()
      return
    }
    if (mod && (e.key === 's' || e.key === 'S')) {
      e.preventDefault()
      handleSave()
      return
    }

    // メタ入力欄では以降のグリッド操作を行わない（通常の入力挙動に任せる）。
    if (target.dataset?.meta) {
      return
    }

    if (mod && (e.key === 'c' || e.key === 'C') && !editing) {
      e.preventDefault()
      editor.copySelected()
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      moveActive(!e.shiftKey)
      return
    }

    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      // 編集中は入力欄の通常操作（キャレット移動など）に任せる。
      if (editing) {
        return
      }
      e.preventDefault()
      const direction =
        e.key === 'ArrowUp'
          ? 'up'
          : e.key === 'ArrowDown'
            ? 'down'
            : e.key === 'ArrowLeft'
              ? 'left'
              : 'right'
      moveActiveDirection(direction)
      return
    }

    if (e.key === 'Enter') {
      if (editing) {
        // remarks セルでは Shift+Enter が改行、単体 Enter が確定。
        if (active?.colId === 'remarks') {
          if (e.shiftKey) {
            // デフォルトの改行動作を許可。
            return
          }
          e.preventDefault()
        } else {
          e.preventDefault()
        }
        flushEdit()
        setEditing(false)
        containerRef.current?.focus()
        return
      }
      if (active) {
        e.preventDefault()
        if (colKind(active.colId) === 'check') {
          editor.toggleFlag(active.rowId, flagFor(active.colId))
        } else {
          startEdit(active.rowId, active.colId)
        }
      }
      return
    }

    if (e.key === 'Escape') {
      if (editing) {
        setEditing(false)
        containerRef.current?.focus()
      }
      return
    }

    if (!editing && active) {
      const kind = colKind(active.colId)
      if (e.key === ' ' && kind === 'check') {
        e.preventDefault()
        editor.toggleFlag(active.rowId, flagFor(active.colId))
        return
      }
      if (kind !== 'check' && e.key.length === 1 && !mod) {
        e.preventDefault()
        startEdit(active.rowId, active.colId, e.key)
      }
    }
  }

  function handleRowSelect(e: React.MouseEvent, rowId: number) {
    deactivateCell()

    if (e.shiftKey) {
      editor.selectRange(rowId)
      return
    }
    if (e.ctrlKey || e.metaKey) {
      editor.toggleRow(rowId)
      return
    }
    if (editor.selectedRowIds.size === 1 && editor.selectedRowIds.has(rowId)) {
      editor.clearRowSelection()
    } else {
      editor.selectRow(rowId)
    }
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      deactivateCell()
    }
  }

  return {
    containerRef,
    inputRef,
    active,
    editing,
    editValue,
    setEditValue,
    validationVisible,
    errors,
    handleSave,
    handleKeyDown,
    handleContainerBlur,
    handleRowSelect,
    startEdit,
    takeComboboxOpenRequest,
    activateCell,
    stopEditing,
  }
}
