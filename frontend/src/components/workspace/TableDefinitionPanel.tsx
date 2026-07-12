import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { TableDefinitionView } from '../table/TableDefinitionView'
import { useTableDefinition } from '../../hooks/useTableDefinition'

import { WorkspacePlaceholder } from './WorkspacePlaceholder'

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
    return <WorkspacePlaceholder message="読込中..." />
  }

  if (error) {
    return (
      <WorkspacePlaceholder title="読込エラー" path={path} message={error} />
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
