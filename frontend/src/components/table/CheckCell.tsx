import { cx } from '../../utils/cx'
import { flagFor } from '../../lib/gridColumns'
import { Checkbox } from '../ui/Checkbox'
import type { DraftColumn } from '../../utils/serializeTable'
import grid from './ColumnGridTable.module.css'
import type { GridNavigation } from './useGridNavigation'
import styles from './TableDefinitionView.module.css'

interface CheckCellProps {
  column: DraftColumn
  colId: string
  nav: GridNavigation
}

export function CheckCell({ column, colId, nav }: CheckCellProps) {
  const checked = column[flagFor(colId)]
  const isActive =
    nav.active?.rowId === column.rowId && nav.active?.colId === colId

  return (
    <td
      className={cx(
        grid.center,
        grid.fixedCol,
        styles.checkCell,
        isActive && styles.activeCell,
      )}
      onMouseDown={() => nav.startEdit(column.rowId, colId)}
    >
      <Checkbox
        checked={checked}
        readOnly
        tabIndex={-1}
        aria-label={
          colId === 'pk'
            ? 'PK'
            : colId === 'identity'
              ? 'ID'
              : 'NOT NULL'
        }
      />
    </td>
  )
}
