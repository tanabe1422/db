import { useState } from 'react'

import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { useTextFile } from '../../hooks/useTextFile'
import { useExternalFileChange } from '../../hooks/useExternalFileChange'
import { ExternalFileChangeDialog } from '../ui/ExternalFileChangeDialog'

import styles from '../../App.module.css'
import { TextFileView } from './TextFileView'

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
