import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { TableDefinitionView } from '../table/TableDefinitionView'
import { useTableDefinition } from '../../hooks/useTableDefinition'

import styles from '../../App.module.css'

interface TableDefinitionPanelProps {
  path: string
  isActive?: boolean
  inlineToolbar?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onEditorBridgeChange?: (bridge: EditorToolbarBridge) => void
}

export function TableDefinitionPanel({
  path,
  isActive,
  inlineToolbar,
  onDirtyChange,
  onEditorBridgeChange,
}: TableDefinitionPanelProps) {
  const { definition, loading, error, reload } = useTableDefinition(path)

  if (loading) {
    return (
      <div className={styles.placeholder}>
        <p>読込中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.placeholder}>
        <h2>読込エラー</h2>
        <p className={styles.path}>{path}</p>
        <p>{error}</p>
      </div>
    )
  }

  if (!definition) {
    return null
  }

  return (
    <TableDefinitionView
      definition={definition}
      path={path}
      isActive={isActive}
      inlineToolbar={inlineToolbar}
      onDirtyChange={onDirtyChange}
      onEditorBridgeChange={onEditorBridgeChange}
      onReload={reload}
    />
  )
}
