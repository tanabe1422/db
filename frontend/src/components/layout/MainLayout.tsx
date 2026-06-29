import type { ReactNode } from 'react'
import { CollapsibleSidebar } from './CollapsibleSidebar'
import styles from './MainLayout.module.css'

interface MainLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function MainLayout({ sidebar, children }: MainLayoutProps) {
  return (
    <div className={styles.shell}>
      <CollapsibleSidebar>{sidebar}</CollapsibleSidebar>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
