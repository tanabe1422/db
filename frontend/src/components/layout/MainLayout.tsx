import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from '../ui/Button'
import styles from './MainLayout.module.css'

interface MainLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  onOpenSettings: () => void
}

export function MainLayout({ sidebar, children, onOpenSettings }: MainLayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>db-gui</h1>
          <p className={styles.subtitle}>*.table.json ブラウザ</p>
        </div>
        <IconButton variant="primary" onClick={onOpenSettings} aria-label="設定">
          <Settings size={16} aria-hidden="true" />
        </IconButton>
      </header>

      <div className={styles.body}>
        {sidebar}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
