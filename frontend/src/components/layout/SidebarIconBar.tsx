import { PanelLeftClose } from 'lucide-react'
import type { ReactNode } from 'react'

import { IconButton } from '../ui/Button'
import { useSidebar } from './sidebarContext'
import styles from './SidebarIconBar.module.css'

interface SidebarIconBarProps {
  children: ReactNode
}

export function SidebarIconBar({ children }: SidebarIconBarProps) {
  const { collapse } = useSidebar()

  return (
    <div className={styles.bar}>
      <div className={styles.actions}>{children}</div>
      <IconButton
        className={styles.collapse}
        onClick={collapse}
        aria-label="サイドパネルを閉じる"
        title="サイドパネルを閉じる"
      >
        <PanelLeftClose size={16} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
