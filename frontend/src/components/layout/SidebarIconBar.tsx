import type { ReactNode } from 'react'

import styles from './SidebarIconBar.module.css'

interface SidebarIconBarProps {
  children: ReactNode
}

export function SidebarIconBar({ children }: SidebarIconBarProps) {
  return <div className={styles.bar}>{children}</div>
}
