import { DISPLAY_COLS } from '../../lib/diffDisplayColumns'
import { isLastPkRow } from '../../lib/gridColumns'
import { diffSideRowNumber, type TableDiff } from '../../lib/diffTable'
import { cx } from '../../utils/cx'
import { ColumnGridHeader } from '../table/ColumnGridHeader'
import grid from '../table/ColumnGridTable.module.css'

import { DiffEmptyCellContent } from './DiffEmptyCellContent'
import { DiffSideCells } from './DiffSideCells'
import styles from './FileDiffView.module.css'

interface DiffSideTableProps {
  diff: TableDiff
  side: 'left' | 'right'
  wrapperRef?: React.RefObject<HTMLDivElement | null>
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}

export function DiffSideTable({
  diff,
  side,
  wrapperRef,
  onScroll,
}: DiffSideTableProps) {
  return (
    <div className={grid.tableWrapper} ref={wrapperRef} onScroll={onScroll}>
      <table className={cx(grid.table, styles.diffTable)}>
        <colgroup>
          {DISPLAY_COLS.map((col) => (
            <col key={col.id} />
          ))}
        </colgroup>
        <thead>
          <ColumnGridHeader />
        </thead>
        <tbody>
          {diff.rows.map((row, index) => {
            const column = side === 'left' ? row.left : row.right
            const rowNumber = diffSideRowNumber(diff.rows, index, side)
            const isPk = (r: (typeof diff.rows)[number]) =>
              side === 'left' ? r.left?.pk : r.right?.pk
            return (
              <tr
                key={`${row.name}-${index}`}
                className={cx(
                  column?.pk && grid.pkRow,
                  isLastPkRow(diff.rows, index, isPk) && grid.pkRowLast,
                )}
              >
                <td
                  className={cx(
                    grid.center,
                    grid.fixedCol,
                    grid.gridLabel,
                    column?.pk && grid.pkRowNum,
                    !column && styles.emptyCell,
                  )}
                >
                  {rowNumber ?? <DiffEmptyCellContent />}
                </td>
                <DiffSideCells column={column} row={row} side={side} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
