import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2 } from 'lucide-react'

import type { TableEditor } from '../../hooks/useTableEditor'
import { IconButton } from '../ui/Button'
import styles from './TableDefinitionView.module.css'

interface RowActionsProps {
  editor: TableEditor
  rowId: number
  index: number
  total: number
}

export function RowActions({ editor, rowId, index, total }: RowActionsProps) {
  return (
    <div className={styles.rowActions}>
      <IconButton
        size="sm"
        onClick={() => editor.moveRowUp(rowId)}
        disabled={index === 0}
        aria-label="上と入れ替え"
        title="上と入れ替え"
      >
        <ArrowUp size={14} aria-hidden="true" />
      </IconButton>
      <IconButton
        size="sm"
        onClick={() => editor.moveRowDown(rowId)}
        disabled={index === total - 1}
        aria-label="下と入れ替え"
        title="下と入れ替え"
      >
        <ArrowDown size={14} aria-hidden="true" />
      </IconButton>
      <IconButton
        size="sm"
        onClick={() => editor.deleteRow(rowId)}
        disabled={total <= 1}
        aria-label="削除"
        title="削除"
      >
        <Trash2 size={14} aria-hidden="true" />
      </IconButton>
      <IconButton
        size="sm"
        onClick={() => editor.addRowBelow(rowId)}
        aria-label="下に新しい行を追加"
        title="下に新しい行を追加"
      >
        <Plus size={14} aria-hidden="true" />
      </IconButton>
      <IconButton
        size="sm"
        onClick={() => editor.pasteBelow(rowId)}
        disabled={editor.clipboardCount === 0}
        aria-label="コピーを下に貼り付け"
        title="コピーを下に貼り付け"
      >
        <ClipboardPaste size={14} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
