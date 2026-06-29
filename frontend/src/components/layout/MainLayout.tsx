import type { ReactNode } from 'react'
import { CollapsibleSidebar, SidebarProvider } from './CollapsibleSidebar'
import styles from './MainLayout.module.css'

interface MainLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  toolbar?: ReactNode
}

export function MainLayout({ sidebar, children, toolbar }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className={styles.shell}>
        {toolbar}
        <div className={styles.body}>
          <CollapsibleSidebar>{sidebar}</CollapsibleSidebar>
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
