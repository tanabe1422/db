import { Terminal } from 'lucide-react'

import { IconButton } from '../ui/Button'
import styles from './WorkspaceToolbar.module.css'

const ICON_SIZE = 14

interface OpenTerminalButtonProps {
  disabled?: boolean
  onOpen: () => void
}

export function OpenTerminalButton({ disabled, onOpen }: OpenTerminalButtonProps) {
  return (
    <IconButton
      className={styles.toolBtn}
      variant="plain"
      size="sm"
      onClick={onOpen}
      disabled={disabled}
      aria-label="ターミナルを開く (Ctrl+@キー)"
      tooltip="ターミナルを開く (Ctrl+@キー)"
    >
      <Terminal size={ICON_SIZE} aria-hidden="true" />
    </IconButton>
  )
}
