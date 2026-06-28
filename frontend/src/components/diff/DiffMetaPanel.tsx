import { cx } from '../../utils/cx'
import { type TableDiff, META_FIELDS } from '../../lib/diffTable'

import styles from './FileDiffView.module.css'

function metaByField(diff: TableDiff, field: string) {
  return diff.meta.find((row) => row.field === field)
}

interface DiffMetaPanelProps {
  diff: TableDiff
  side: 'left' | 'right'
}

export function DiffMetaPanel({ diff, side }: DiffMetaPanelProps) {
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
