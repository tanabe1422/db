import { useRef } from 'react'
import { ArrowLeft } from 'lucide-react'

import { cx } from '../../utils/cx'
import { GRID_COLUMNS, cellValue } from '../../lib/gridColumns'
import {
  type ColumnDiffRow,
  type MetaDiffRow,
  type TableDiff,
  META_FIELDS,
} from '../../lib/diffTable'
import type { DraftColumn } from '../../utils/serializeTable'

import { DiffSideMark } from './DiffSideMark'
import styles from './FileDiffView.module.css'

type CellKind = 'check' | 'marker' | 'text' | 'num'

interface DisplayCol {
  id: string
  label: string
  kind: CellKind
  cls?: string
}

// 差分表示の列は共通の列定義(GRID_COLUMNS)から導出する。
// 桁数/精度は数値列、カラム名/型は等幅表示にする。
const DISPLAY_COLS: DisplayCol[] = GRID_COLUMNS.map((column) => ({
  id: column.id,
  label: column.label,
  kind:
    column.role === 'check'
      ? 'check'
      : column.role === 'marker'
        ? 'marker'
        : column.id === 'len' || column.id === 'scale'
          ? 'num'
          : 'text',
  cls:
    column.role === 'check'
      ? styles.center
      : column.role === 'marker'
        ? styles.markerCol
        : column.id === 'name' || column.id === 'dataType'
          ? styles.mono
          : undefined,
}))

interface FileDiffViewProps {
  relPath: string
  diff: TableDiff
  onBack: () => void
}

function metaByField(diff: TableDiff, field: string): MetaDiffRow | undefined {
  return diff.meta.find((row) => row.field === field)
}

function MetaPanel({ diff, side }: { diff: TableDiff; side: 'left' | 'right' }) {
  return (
    <dl className={styles.metaPanel}>
      {META_FIELDS.map(({ field, label, wrap }) => {
        const row = metaByField(diff, field)
        if (!row) return null
        const value = side === 'left' ? row.left : row.right
        return (
          <div
            key={field}
            className={cx(styles.metaPanelRow, row.changed && styles.metaChanged)}
          >
            <dt>{label}</dt>
            <dd className={wrap ? styles.metaWrap : undefined}>
              {value || <span className={styles.metaEmpty}>—</span>}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function renderSideCells(
  column: DraftColumn | undefined,
  row: ColumnDiffRow,
  side: 'left' | 'right',
) {
  return DISPLAY_COLS.map((col) => {
    const highlightChanged =
      row.status === 'changed' && row.changed.has(col.id)
    const highlightAdded = row.status === 'added' && side === 'right'
    const highlightRemoved = row.status === 'removed' && side === 'left'

    const cellCls = cx(
      col.cls,
      !column && styles.emptyCell,
      highlightChanged && styles.changedCell,
      highlightAdded && styles.addedCell,
      highlightRemoved && styles.removedCell,
    )

    if (!column) {
      return <td key={`${side}-${col.id}`} className={cellCls} />
    }

    if (col.kind === 'check') {
      const checked = cellValue(column, col.id) === '1'
      return (
        <td key={`${side}-${col.id}`} className={cellCls}>
          <input
            type="checkbox"
            className={styles.checkInput}
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
        <span className={styles.cellText}>{cellValue(column, col.id)}</span>
      </td>
    )
  })
}

function SideTable({
  diff,
  side,
  wrapperRef,
  onScroll,
}: {
  diff: TableDiff
  side: 'left' | 'right'
  wrapperRef?: React.RefObject<HTMLDivElement | null>
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}) {
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
              <th key={col.id} className={cx(styles.center, col.cls)}>
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
                {renderSideCells(column, row, side)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function FileDiffView({ relPath, diff, onBack }: FileDiffViewProps) {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  function handleLeftScroll() {
    if (syncingRef.current) return
    syncingRef.current = true
    if (rightRef.current && leftRef.current) {
      rightRef.current.scrollLeft = leftRef.current.scrollLeft
    }
    syncingRef.current = false
  }

  function handleRightScroll() {
    if (syncingRef.current) return
    syncingRef.current = true
    if (leftRef.current && rightRef.current) {
      leftRef.current.scrollLeft = rightRef.current.scrollLeft
    }
    syncingRef.current = false
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          ファイル一覧に戻る
        </button>
        <span className={styles.fileName} title={relPath}>
          {relPath}
        </span>
      </div>

      <div className={styles.split}>
        <div className={styles.pane}>
          <div className={styles.meta}>
            <MetaPanel diff={diff} side="left" />
          </div>
          <SideTable diff={diff} side="left" wrapperRef={leftRef} onScroll={handleLeftScroll} />
        </div>
        <div className={styles.pane}>
          <div className={styles.meta}>
            <MetaPanel diff={diff} side="right" />
          </div>
          <SideTable diff={diff} side="right" wrapperRef={rightRef} onScroll={handleRightScroll} />
        </div>
      </div>
    </div>
  )
}
