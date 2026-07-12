import { Button } from './Button'
import { DialogBody, DialogFooter, DialogShell, dialogStyles } from './DialogShell'

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
  return (
    <DialogShell
      open={open}
      role="alertdialog"
      size="lg"
      labelledBy="alert-title"
      onBackdropClick={onClose}
    >
      <DialogBody scrollable>
        <h2 id="alert-title" className={dialogStyles.title}>
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
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{confirmLabel}</Button>
      </DialogFooter>
    </DialogShell>
  )
}
