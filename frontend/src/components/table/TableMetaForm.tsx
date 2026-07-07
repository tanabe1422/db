import type { MetaField } from '../../hooks/useTableEditor'
import meta from './TableMetaPanel.module.css'
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
    <dl className={meta.metaGrid}>
      <div className={meta.nameCol}>
        <div className={meta.row}>
          <dt>テーブル名（英）</dt>
          <dd>
            <input
              data-meta="1"
              className={styles.metaInput}
              value={name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </dd>
        </div>
        <div className={meta.row}>
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
      <div className={meta.descRow}>
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
