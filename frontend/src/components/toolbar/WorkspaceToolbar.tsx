import type { ReactNode } from 'react'

import { SidebarToggleButton } from './SidebarToggleButton'
import styles from './WorkspaceToolbar.module.css'

interface WorkspaceToolbarProps {
  children?: ReactNode
  trailing?: ReactNode
}

export function WorkspaceToolbar({ children, trailing }: WorkspaceToolbarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.leading}>
        <SidebarToggleButton />
        {children && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            {children}
          </>
        )}
      </div>
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </header>
  )
}
