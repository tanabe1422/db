import { cx } from '../../utils/cx'
import { cellValue } from '../../lib/gridColumns'
import type { DraftColumn } from '../../utils/serializeTable'
import type { TableEditor } from '../../hooks/useTableEditor'
import { DATA_TYPES, colKind } from './navColumns'
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
  editor,
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
              // select は1回目クリックで編集開始（プルダウン表示）。
              // それ以外は1回目: 選択、2回目: 編集開始。
              // onClick（クリック完了後）に発火させることで、編集要素の生成直後に
              // フォーカス競合で onBlur が走り select が即閉じする問題を防ぐ。
              if (kind === 'select' || isActive) {
                nav.startEdit(column.rowId, colId, undefined, false)
              } else {
                nav.activateCell(column.rowId, colId)
              }
            }
      }
    >
      {isEditing && kind === 'select' ? (
        <select
          ref={(el) => {
            nav.inputRef.current = el
          }}
          className={styles.cellSelect}
          value={nav.editValue}
          onChange={(ev) => {
            nav.setEditValue(ev.target.value)
            editor.updateCell(column.rowId, 'dataType', ev.target.value)
          }}
          onBlur={() => nav.stopEditing()}
        >
          {DATA_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      ) : isEditing && colId === 'remarks' ? (
        <textarea
          ref={(el) => {
            nav.inputRef.current = el
            if (el) {
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }
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
