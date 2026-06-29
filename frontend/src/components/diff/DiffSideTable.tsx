import { DISPLAY_COLS } from '../../lib/diffDisplayColumns'
import type { TableDiff } from '../../lib/diffTable'
import { cx } from '../../utils/cx'
import { ColumnGridHeader } from '../table/ColumnGridHeader'
import grid from '../table/ColumnGridTable.module.css'

import { DiffSideCells } from './DiffSideCells'

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
      <table className={grid.table}>
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
            return (
              <tr key={`${row.name}-${index}`}>
                <td className={cx(grid.center, grid.fixedCol, grid.gridLabel)}>
                  {index + 1}
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
