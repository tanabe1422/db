import { cx } from '../../utils/cx'
import { DISPLAY_COLS } from '../../lib/diffDisplayColumns'
import type { TableDiff } from '../../lib/diffTable'

import { displayColClass } from './diffDisplayStyles'
import { DiffSideCells } from './DiffSideCells'
import { DiffSideMark } from './DiffSideMark'
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
    <div className={styles.tableWrapper} ref={wrapperRef} onScroll={onScroll}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.numColGroup} />
          {DISPLAY_COLS.map((col) => (
            <col key={col.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} className={styles.center}>
              番号
            </th>
            <th colSpan={DISPLAY_COLS.length} className={styles.sideHead}>
              <span className={styles.sideHeadMark}>
                <DiffSideMark side={side} />
              </span>
            </th>
          </tr>
          <tr>
            {DISPLAY_COLS.map((col) => (
              <th key={col.id} className={cx(styles.center, displayColClass(col))}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diff.rows.map((row, index) => {
            const column = side === 'left' ? row.left : row.right
            return (
              <tr key={`${row.name}-${index}`}>
                <td className={styles.center}>{index + 1}</td>
                <DiffSideCells column={column} row={row} side={side} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
