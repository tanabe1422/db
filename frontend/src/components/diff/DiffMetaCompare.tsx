import { cx } from '../../utils/cx'
import { type TableDiff, META_FIELDS } from '../../lib/diffTable'

import styles from './FileDiffView.module.css'

function metaByField(diff: TableDiff, field: string) {
  return diff.meta.find((row) => row.field === field)
}

interface MetaFieldProps {
  label: string
  value: string
  wrap?: boolean
  changed: boolean
}

function MetaField({ label, value, wrap, changed }: MetaFieldProps) {
  return (
    <dl className={cx(styles.metaField, changed && styles.metaChanged)}>
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
  return (
    <div
      className={styles.metaCompare}
      style={{ gridTemplateRows: `repeat(${META_FIELDS.length}, auto)` }}
    >
      <div className={styles.metaSide}>
        {META_FIELDS.map(({ field, label, wrap }) => {
          const row = metaByField(diff, field)
          if (!row) return null
          return (
            <MetaField
              key={field}
              label={label}
              value={row.left}
              wrap={wrap}
              changed={row.changed}
            />
          )
        })}
      </div>
      <div className={styles.metaSide}>
        {META_FIELDS.map(({ field, label, wrap }) => {
          const row = metaByField(diff, field)
          if (!row) return null
          return (
            <MetaField
              key={field}
              label={label}
              value={row.right}
              wrap={wrap}
              changed={row.changed}
            />
          )
        })}
      </div>
    </div>
  )
}
