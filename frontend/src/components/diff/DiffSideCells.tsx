import { cx } from '../../utils/cx'
import { cellValue } from '../../lib/gridColumns'
import {
  DISPLAY_COLS,
  diffCellHighlight,
} from '../../lib/diffDisplayColumns'
import type { ColumnDiffRow } from '../../lib/diffTable'
import type { DraftColumn } from '../../utils/serializeTable'

import { Checkbox } from '../ui/Checkbox'
import { DiffEmptyCellContent } from './DiffEmptyCellContent'
import { displayColClass, highlightClass } from './diffDisplayStyles'
import grid from '../table/ColumnGridTable.module.css'
import styles from './FileDiffView.module.css'

interface DiffSideCellsProps {
  column: DraftColumn | undefined
  row: ColumnDiffRow
  side: 'left' | 'right'
}

export function DiffSideCells({ column, row, side }: DiffSideCellsProps) {
  return (
    <>
      {DISPLAY_COLS.map((col) => {
        const highlight = diffCellHighlight(row, col.id, side)
        const cellCls = cx(
          displayColClass(col),
          !column && styles.emptyCell,
          highlightClass(highlight),
        )

        if (!column) {
          return (
            <td key={`${side}-${col.id}`} className={cellCls}>
              <DiffEmptyCellContent />
            </td>
          )
        }

        if (col.kind === 'check') {
          const checked = cellValue(column, col.id) === '1'
          return (
            <td key={`${side}-${col.id}`} className={cellCls}>
              <Checkbox
                checked={checked}
                readOnly
                tabIndex={-1}
                aria-label={col.label}
              />
            </td>
          )
        }

        return (
          <td key={`${side}-${col.id}`} className={cellCls}>
            <span className={grid.cellText}>{cellValue(column, col.id)}</span>
          </td>
        )
      })}
    </>
  )
}
