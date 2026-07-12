import type { ReactNode } from 'react'

import { cx } from '../../utils/cx'

import styles from './DialogShell.module.css'

interface DialogShellProps {
  open: boolean
  labelledBy: string
  onBackdropClick: () => void
  role?: 'dialog' | 'alertdialog'
  size?: 'md' | 'lg'
  children: ReactNode
}

export function DialogShell({
  open,
  labelledBy,
  onBackdropClick,
  role = 'dialog',
  size = 'md',
  children,
}: DialogShellProps) {
  if (!open) {
    return null
  }

  return (
    <div className={styles.backdrop} onClick={onBackdropClick}>
      <div
        className={cx(styles.dialog, size === 'lg' && styles.dialogWide)}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogBody({
  children,
  scrollable = false,
}: {
  children: ReactNode
  scrollable?: boolean
}) {
  return (
    <div className={cx(styles.body, scrollable && styles.bodyScrollable)}>
      {children}
    </div>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>
}

export { styles as dialogStyles }
