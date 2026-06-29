import { Redo2, Save, Undo2 } from 'lucide-react'

import type { ToolbarEditor } from './editorToolbarBridge'
import { cx } from '../../utils/cx'
import { IconButton } from '../ui/Button'
import styles from './WorkspaceToolbar.module.css'

interface EditToolbarProps {
  editor: ToolbarEditor | null
  onSave: (() => void) | null
}

const ICON_SIZE = 14

export function EditToolbar({ editor, onSave }: EditToolbarProps) {
  const dirty = editor?.dirty ?? false
  const saving = editor?.saving ?? false
  const canUndo = editor?.canUndo ?? false
  const canRedo = editor?.canRedo ?? false
  const saveError = editor?.saveError

  return (
    <>
      <IconButton
        className={cx(styles.toolBtn, styles.saveBtn)}
        variant="plain"
        size="sm"
        onClick={() => onSave?.()}
        disabled={!editor || !dirty || saving}
        aria-label="保存"
        tooltip="保存"
      >
        <Save size={ICON_SIZE} aria-hidden="true" />
      </IconButton>
      <IconButton
        className={styles.toolBtn}
        variant="plain"
        size="sm"
        onClick={() => editor?.undo()}
        disabled={!canUndo}
        aria-label="元に戻す (Ctrl+Z)"
        tooltip="元に戻す (Ctrl+Z)"
      >
        <Undo2 size={ICON_SIZE} aria-hidden="true" />
      </IconButton>
      <IconButton
        className={styles.toolBtn}
        variant="plain"
        size="sm"
        onClick={() => editor?.redo()}
        disabled={!canRedo}
        aria-label="やり直し (Ctrl+Y)"
        tooltip="やり直し (Ctrl+Y)"
      >
        <Redo2 size={ICON_SIZE} aria-hidden="true" />
      </IconButton>
      {saveError && <span className={styles.saveError}>{saveError}</span>}
    </>
  )
}
