import { FolderCog, RefreshCw } from 'lucide-react'

import { SidebarIconBar } from '../layout/SidebarIconBar'
import { useSidebar } from '../layout/sidebarContext'
import { IconButton } from '../ui/Button'
import { SidebarModeSwitcher, type SidebarMode } from './SidebarModeSwitcher'
import styles from './SidebarOperationPanel.module.css'



export type { SidebarMode }



interface SidebarOperationPanelProps {

  mode: SidebarMode

  activeDirectory: string

  loading?: boolean

  onManageDirectories: () => void

  onRescan: () => void

  onModeChange: (mode: SidebarMode) => void

}



export function SidebarOperationPanel({

  mode,

  activeDirectory,

  loading = false,

  onManageDirectories,

  onRescan,

  onModeChange,

}: SidebarOperationPanelProps) {

  const { collapsed } = useSidebar()

  const hasDirectory = Boolean(activeDirectory)

  if (collapsed) {
    return (
      <nav className={styles.collapsedRail} aria-label="サイドバー操作">
        <IconButton
          onClick={onManageDirectories}
          aria-label="ディレクトリを追加・編集"
          tooltip="ディレクトリを追加・編集"
        >
          <FolderCog size={16} aria-hidden="true" />
        </IconButton>
        <IconButton
          onClick={onRescan}
          disabled={!hasDirectory || loading}
          aria-label="再読込"
          tooltip="再読込"
        >
          <RefreshCw size={16} aria-hidden="true" />
        </IconButton>
        <div className={styles.dividerHorizontal} aria-hidden="true" />
        <SidebarModeSwitcher
          mode={mode}
          hasDirectory={hasDirectory}
          onModeChange={onModeChange}
          vertical
        />
      </nav>
    )
  }



  return (

    <SidebarIconBar>

      <IconButton

        onClick={onManageDirectories}

        aria-label="ディレクトリを追加・編集"

        tooltip="ディレクトリを追加・編集"

      >

        <FolderCog size={16} aria-hidden="true" />

      </IconButton>

      <IconButton

        onClick={onRescan}

        disabled={!hasDirectory || loading}

        aria-label="再読込"

        tooltip="再読込"

      >

        <RefreshCw size={16} aria-hidden="true" />

      </IconButton>

      <div className={styles.divider} aria-hidden="true" />

      <SidebarModeSwitcher

        mode={mode}

        hasDirectory={hasDirectory}

        onModeChange={onModeChange}

      />

    </SidebarIconBar>

  )

}


