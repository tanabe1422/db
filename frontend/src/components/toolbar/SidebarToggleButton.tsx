import { ChevronsLeft, ChevronsRight } from 'lucide-react'

import { useSidebar } from '../layout/sidebarContext'
import { IconButton } from '../ui/Button'
import styles from './WorkspaceToolbar.module.css'

const ICON_SIZE = 14

export function SidebarToggleButton() {
  const { collapsed, collapse, expand } = useSidebar()

  if (collapsed) {
    return (
      <IconButton
        className={styles.sidebarToggle}
        variant="plain"
        size="sm"
        onClick={expand}
        aria-label="サイドパネルを開く"
        tooltip="サイドパネルを開く"
      >
        <ChevronsRight size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />
      </IconButton>
    )
  }

  return (
    <IconButton
      className={styles.sidebarToggle}
      variant="plain"
      size="sm"
      onClick={collapse}
      aria-label="サイドパネルを閉じる"
      tooltip="サイドパネルを閉じる"
    >
      <ChevronsLeft size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />
    </IconButton>
  )
}
