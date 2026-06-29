import { cx } from '../../utils/cx'
import { cellValue } from '../../lib/gridColumns'
import type { DraftColumn } from '../../utils/serializeTable'
import type { TableEditor } from '../../hooks/useTableEditor'
import { DATA_TYPES, colKind } from './navColumns'
import {
  DataTypeCombobox,
  DataTypeComboboxDisplay,
} from './DataTypeCombobox'
import type { GridNavigation } from './useGridNavigation'
import styles from './TableDefinitionView.module.css'

interface EditableCellProps {
  column: DraftColumn
  colId: string
  tdClass?: string
  nav: GridNavigation
  editor: TableEditor
}

export function EditableCell({
  column,
  colId,
  tdClass,
  nav,
}: EditableCellProps) {
  const isActive =
    nav.active?.rowId === column.rowId && nav.active?.colId === colId
  const isEditing = isActive && nav.editing
  const kind = colKind(colId)
  const value = cellValue(column, colId)

  return (
    <td
      className={cx(tdClass, isActive && styles.activeCell)}
      onClick={
        isEditing
          ? undefined
          : () => {
              if (kind === 'combobox') {
                if (!isActive) {
                  nav.activateCell(column.rowId, colId)
                } else {
                  nav.startEdit(column.rowId, colId, undefined, false)
                }
                return
              }
              if (isActive) {
                nav.startEdit(column.rowId, colId, undefined, false)
              } else {
                nav.activateCell(column.rowId, colId)
              }
            }
      }
    >
      {isEditing && kind === 'combobox' ? (
        <DataTypeCombobox
          value={nav.editValue}
          onChange={nav.setEditValue}
          inputRef={nav.inputRef as React.MutableRefObject<HTMLInputElement | null>}
          suggestions={DATA_TYPES}
          requestOpenOnMount={nav.takeComboboxOpenRequest}
        />
      ) : isEditing && colId === 'remarks' ? (
        <textarea
          ref={(el) => {
            nav.inputRef.current = el
          }}
          className={styles.cellTextarea}
          value={nav.editValue}
          onChange={(ev) => {
            nav.setEditValue(ev.target.value)
            ev.target.style.height = 'auto'
            ev.target.style.height = `${ev.target.scrollHeight}px`
          }}
          rows={1}
          cols={1}
        />
      ) : isEditing ? (
        <input
          ref={(el) => {
            nav.inputRef.current = el
          }}
          className={styles.cellInput}
          value={nav.editValue}
          onChange={(ev) => nav.setEditValue(ev.target.value)}
        />
      ) : kind === 'combobox' ? (
        <DataTypeComboboxDisplay
          value={value}
          onOpenList={() =>
            nav.startEdit(column.rowId, colId, undefined, false, { openCombobox: true })
          }
        />
      ) : colId === 'remarks' ? (
        <span className={`${styles.cellText} ${styles.cellTextRemarks}`}>
          {value}
        </span>
      ) : (
        <span className={styles.cellText}>{value}</span>
      )}
    </td>
  )
}
