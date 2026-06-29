import type { ReactNode } from 'react'

import { cx } from '../../utils/cx'
import { useSidebar } from '../layout/sidebarContext'
import { truncateMiddle } from '../../utils/truncateMiddle'
import { Tooltip } from '../ui/Tooltip'
import {
  SidebarOperationPanel,
  type SidebarMode,
} from './SidebarOperationPanel'
import styles from './SidebarPanelLayout.module.css'

export type { SidebarMode }

interface SidebarPanelLayoutProps {
  mode: SidebarMode
  activeDirectory: string
  loading?: boolean
  onManageDirectories: () => void
  onRescan: () => void
  onModeChange: (mode: SidebarMode) => void
  children: ReactNode
}

export function SidebarPanelLayout({
  mode,
  activeDirectory,
  loading,
  onManageDirectories,
  onRescan,
  onModeChange,
  children,
}: SidebarPanelLayoutProps) {
  const { collapsed } = useSidebar()

  return (
    <aside className={cx(styles.panel, collapsed && styles.panelCollapsed)}>
      <div className={cx(styles.header, collapsed && styles.headerCollapsed)}>
        <SidebarOperationPanel
          mode={mode}
          activeDirectory={activeDirectory}
          loading={loading}
          onManageDirectories={onManageDirectories}
          onRescan={onRescan}
          onModeChange={onModeChange}
        />
        {!collapsed && activeDirectory && (
          <Tooltip content={activeDirectory} wrap>
            <p className={styles.path}>{truncateMiddle(activeDirectory, 48)}</p>
          </Tooltip>
        )}
      </div>
      {!collapsed && (
        <div className={styles.body}>
          <div className={styles.bodyInner}>{children}</div>
        </div>
      )}
    </aside>
  )
}
