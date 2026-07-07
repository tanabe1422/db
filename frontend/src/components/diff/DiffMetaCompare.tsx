import { Fragment } from 'react'

import { cx } from '../../utils/cx'
import { type TableDiff, META_FIELDS } from '../../lib/diffTable'
import meta from '../table/TableMetaPanel.module.css'

import styles from './FileDiffView.module.css'

function metaByField(diff: TableDiff, field: string) {
  return diff.meta.find((row) => row.field === field)
}

interface MetaFieldProps {
  label: string
  value: string
  wrap?: boolean
  changed: boolean
  side: 'left' | 'right'
  rowIndex: number
  rowCount: number
}

function MetaField({
  label,
  value,
  wrap,
  changed,
  side,
  rowIndex,
  rowCount,
}: MetaFieldProps) {
  const isFirst = rowIndex === 0
  const isLast = rowIndex === rowCount - 1

  return (
    <dl
      className={cx(
        wrap ? meta.descRow : meta.row,
        styles.metaField,
        side === 'left' ? styles.metaFieldLeft : styles.metaFieldRight,
        isFirst && styles.metaFieldFirst,
        isLast && styles.metaFieldLast,
        changed && styles.metaChanged,
      )}
    >
      <dt>{label}</dt>
      <dd className={wrap ? styles.metaWrap : undefined}>
        {value || <span className={styles.metaEmpty}>—</span>}
      </dd>
    </dl>
  )
}

interface DiffMetaCompareProps {
  diff: TableDiff
}

export function DiffMetaCompare({ diff }: DiffMetaCompareProps) {
  const rowCount = META_FIELDS.length

  return (
    <div className={styles.metaCompare}>
      {META_FIELDS.map(({ field, label, wrap }, rowIndex) => {
        const row = metaByField(diff, field)
        if (!row) return null
        return (
          <Fragment key={field}>
            <MetaField
              label={label}
              value={row.left}
              wrap={wrap}
              changed={row.changed}
              side="left"
              rowIndex={rowIndex}
              rowCount={rowCount}
            />
            <MetaField
              label={label}
              value={row.right}
              wrap={wrap}
              changed={row.changed}
              side="right"
              rowIndex={rowIndex}
              rowCount={rowCount}
            />
          </Fragment>
        )
      })}
    </div>
  )
}
