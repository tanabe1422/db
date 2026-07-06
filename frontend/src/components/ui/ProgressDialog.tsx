import styles from './ProgressDialog.module.css'

interface ProgressDialogProps {
  open: boolean
  title: string
  current: number
  total: number
  label?: string
}

export function ProgressDialog({
  open,
  title,
  current,
  total,
  label,
}: ProgressDialogProps) {
  if (!open) {
    return null
  }

  const safeTotal = Math.max(total, 1)
  const percent = Math.min(100, Math.round((current / safeTotal) * 100))

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-title"
        aria-busy="true"
      >
        <div className={styles.body}>
          <h2 id="progress-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.count}>
            {current} / {total}
          </p>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${current} / ${total}`}
          >
            <div className={styles.bar} style={{ width: `${percent}%` }} />
          </div>
          {label && <p className={styles.label}>{label}</p>}
        </div>
      </div>
    </div>
  )
}
