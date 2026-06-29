import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { getTreeFileKindFromPath } from '../../utils/treeFileKind'
import { TableDefinitionPanel } from './TableDefinitionPanel'
import { TextFilePanel } from './TextFilePanel'

interface WorkspaceFilePanelProps {
  path: string
  isActive?: boolean
  inlineToolbar?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onEditorBridgeChange?: (bridge: EditorToolbarBridge) => void
}

export function WorkspaceFilePanel({
  path,
  isActive,
  inlineToolbar,
  onDirtyChange,
  onEditorBridgeChange,
}: WorkspaceFilePanelProps) {
  const kind = getTreeFileKindFromPath(path)

  if (kind === 'sql') {
    return (
      <TextFilePanel
        path={path}
        isActive={isActive}
        onDirtyChange={onDirtyChange}
        onEditorBridgeChange={onEditorBridgeChange}
      />
    )
  }

  return (
    <TableDefinitionPanel
      path={path}
      isActive={isActive}
      inlineToolbar={inlineToolbar}
      onDirtyChange={onDirtyChange}
      onEditorBridgeChange={onEditorBridgeChange}
    />
  )
}
