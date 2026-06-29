import { Button } from './Button'
import styles from './AlertDialog.module.css'

export interface AlertDialogItem {
  label: string
  detail?: string
}

interface AlertDialogProps {
  open: boolean
  title: string
  message: string
  items?: AlertDialogItem[]
  confirmLabel?: string
  onClose: () => void
}

export function AlertDialog({
  open,
  title,
  message,
  items,
  confirmLabel = 'OK',
  onClose,
}: AlertDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.body}>
          <h2 id="alert-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.message}>{message}</p>
          {items && items.length > 0 && (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.label} className={styles.listItem}>
                  <span className={styles.listLabel}>{item.label}</span>
                  {item.detail && (
                    <span className={styles.listDetail}>{item.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.footer}>
          <Button onClick={onClose}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
