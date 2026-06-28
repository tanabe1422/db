import { cx } from '../../utils/cx'
import type { MetaField } from '../../hooks/useTableEditor'
import styles from './TableDefinitionView.module.css'

interface TableMetaFormProps {
  name: string
  nameJa: string
  description: string
  onChange: (field: MetaField, value: string) => void
}

export function TableMetaForm({
  name,
  nameJa,
  description,
  onChange,
}: TableMetaFormProps) {
  return (
    <dl className={styles.meta}>
      <div className={styles.metaNameCol}>
        <div className={styles.metaRow}>
          <dt>テーブル名（英）</dt>
          <dd>
            <input
              data-meta="1"
              className={cx(styles.metaInput, styles.mono)}
              value={name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </dd>
        </div>
        <div className={styles.metaRow}>
          <dt>テーブル名（日）</dt>
          <dd>
            <input
              data-meta="1"
              className={styles.metaInput}
              value={nameJa}
              onChange={(e) => onChange('nameJa', e.target.value)}
            />
          </dd>
        </div>
      </div>
      <div className={styles.metaDescBlock}>
        <dt>テーブル概要</dt>
        <dd>
          <textarea
            data-meta="1"
            className={styles.metaTextarea}
            value={description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
          />
        </dd>
      </div>
    </dl>
  )
}
