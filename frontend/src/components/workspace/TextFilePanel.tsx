import { useState } from 'react'

import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { useTextFile } from '../../hooks/useTextFile'
import { useExternalFileChange } from '../../hooks/useExternalFileChange'
import { ExternalFileChangeDialog } from '../ui/ExternalFileChangeDialog'

import { TextFileView } from './TextFileView'
import { WorkspacePlaceholder } from './WorkspacePlaceholder'

interface TextFilePanelProps {
  path: string
  isActive?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onEditorBridgeChange?: (bridge: EditorToolbarBridge) => void
}

export function TextFilePanel({
  path,
  isActive,
  onDirtyChange,
  onEditorBridgeChange,
}: TextFilePanelProps) {
  const { content, loading, error, reload } = useTextFile(path)
  const [dirty, setDirty] = useState(false)
  const { dialogOpen, handleReload, handleIgnore, handleCancel } =
    useExternalFileChange({
      path,
      dirty,
      onReload: reload,
    })

  const fileName = path.split(/[\\/]/).pop() ?? path

  if (loading) {
    return <WorkspacePlaceholder message="読込中..." />
  }

  if (error) {
    return (
      <WorkspacePlaceholder title="読込エラー" path={path} message={error} />
    )
  }

  if (content === null) {
    return null
  }

  return (
    <>
      <TextFileView
        path={path}
        content={content}
        isActive={isActive}
        onDirtyChange={(nextDirty) => {
          setDirty(nextDirty)
          onDirtyChange?.(nextDirty)
        }}
        onEditorBridgeChange={onEditorBridgeChange}
      />
      <ExternalFileChangeDialog
        open={dialogOpen}
        fileName={fileName}
        onReload={() => {
          void handleReload()
        }}
        onIgnore={() => {
          void handleIgnore()
        }}
        onCancel={handleCancel}
      />
    </>
  )
}
