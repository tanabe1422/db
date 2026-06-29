import { IDENTITY_COLUMN_TITLE } from '../../lib/gridColumns'
import { DISPLAY_COLS } from '../../lib/diffDisplayColumns'
import type { TableDiff } from '../../lib/diffTable'
import {
  MAX_INDEXES,
  MAX_UNIQUE_CONSTRAINTS,
  MAX_UNIQUE_INDEXES,
} from '../../utils/columnMeta'
import {
  indexNumbers,
  uniqueIndexNumbers,
  uniqueNumbers,
} from '../table/navColumns'

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
            <th rowSpan={2} className={styles.center}>
              PK
            </th>
            <th
              className={`${styles.center} ${styles.groupHeader}`}
              colSpan={MAX_UNIQUE_INDEXES}
            >
              <span className={styles.headerStack}>
                Unique
                <br />
                Index
              </span>
            </th>
            <th className={styles.center} colSpan={MAX_INDEXES}>
              Index
            </th>
            <th
              className={styles.center}
              rowSpan={2}
              title={IDENTITY_COLUMN_TITLE}
            >
              ID
            </th>
            <th className={styles.center} colSpan={MAX_UNIQUE_CONSTRAINTS}>
              Unique
            </th>
            <th
              className={styles.center}
              rowSpan={2}
              title="NOT NULL"
            >
              NN
            </th>
            <th rowSpan={2}>カラム名（英）</th>
            <th rowSpan={2}>カラム名（日）</th>
            <th className={`${styles.mono} ${styles.typeCell}`} rowSpan={2}>
              型
            </th>
            <th className={styles.numCell} rowSpan={2}>
              桁数
            </th>
            <th className={styles.numCell} rowSpan={2}>
              精度
            </th>
            <th rowSpan={2}>既定値</th>
            <th rowSpan={2}>備考</th>
          </tr>
          <tr>
            {uniqueIndexNumbers.map((number) => (
              <th key={`uidx${number}`} className={styles.markerCol}>
                {number}
              </th>
            ))}
            {indexNumbers.map((number) => (
              <th key={`idx${number}`} className={styles.markerCol}>
                {number}
              </th>
            ))}
            {uniqueNumbers.map((number) => (
              <th key={`uq${number}`} className={styles.markerCol}>
                {number}
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
