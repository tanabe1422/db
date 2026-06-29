import { PanelLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { cx } from '../../utils/cx'
import { IconButton } from '../ui/Button'
import { SidebarContext } from './sidebarContext'
import styles from './CollapsibleSidebar.module.css'

const STORAGE_KEY = 'db-gui.sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore
  }
}

interface CollapsibleSidebarProps {
  children: ReactNode
}

export function CollapsibleSidebar({ children }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    writeCollapsed(collapsed)
  }, [collapsed])

  const expand = useCallback(() => setCollapsed(false), [])
  const collapse = useCallback(() => setCollapsed(true), [])

  const contextValue = useMemo(
    () => ({ collapsed, collapse, expand }),
    [collapsed, collapse, expand],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={cx(styles.wrapper, collapsed && styles.wrapperCollapsed)}
        data-collapsed={collapsed || undefined}
      >
        <div className={styles.content} hidden={collapsed}>
          {children}
        </div>
        {collapsed && (
          <div className={styles.rail}>
            <IconButton
              className={styles.railToggle}
              onClick={expand}
              aria-label="サイドパネルを開く"
              title="サイドパネルを開く"
            >
              <PanelLeft size={16} aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </div>
    </SidebarContext.Provider>
  )
}
