import { Redo2, Save, Undo2 } from 'lucide-react'

import type { TableEditor } from '../../hooks/useTableEditor'
import { Button, IconButton } from '../ui/Button'
import styles from './TableDefinitionView.module.css'

interface EditorToolbarProps {
  editor: TableEditor
  onSave: () => void
}

export function EditorToolbar({ editor, onSave }: EditorToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <Button
        className={styles.saveBtn}
        onClick={onSave}
        disabled={!editor.dirty || editor.saving}
      >
        <Save size={16} aria-hidden="true" />
        保存
      </Button>
      <IconButton
        onClick={() => editor.undo()}
        disabled={!editor.canUndo}
        aria-label="元に戻す (Ctrl+Z)"
        title="元に戻す (Ctrl+Z)"
      >
        <Undo2 size={16} aria-hidden="true" />
      </IconButton>
      <IconButton
        onClick={() => editor.redo()}
        disabled={!editor.canRedo}
        aria-label="やり直し (Ctrl+Y)"
        title="やり直し (Ctrl+Y)"
      >
        <Redo2 size={16} aria-hidden="true" />
      </IconButton>
      <span className={styles.toolbarSpacer} />
      {editor.saveError && (
        <span className={styles.saveError}>{editor.saveError}</span>
      )}
      <span className={editor.dirty ? styles.dirtyBadge : styles.saved}>
        {editor.dirty ? '未保存の変更あり' : '保存済み'}
      </span>
    </div>
  )
}
