import { useCallback, useEffect, useRef } from 'react'
import { ExternalLink } from 'lucide-react'

import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { useSaveShortcut } from '../../hooks/useSaveShortcut'
import { useTextFileEditor } from '../../hooks/useTextFileEditor'
import { errorMessage } from '../../lib/errorMessage'
import { openWithDefaultApp } from '../../lib/wails'
import { Button } from '../ui/Button'

import { SqlCodeEditor } from './SqlCodeEditor'
import styles from './TextFileView.module.css'

interface TextFileViewProps {
  path: string
  content: string
  isActive?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onEditorBridgeChange?: (bridge: EditorToolbarBridge) => void
}

export function TextFileView({
  path,
  content,
  isActive = true,
  onDirtyChange,
  onEditorBridgeChange,
}: TextFileViewProps) {
  const { viewRef, editor, save, syncDirty } = useTextFileEditor(path, content)
  const saveRef = useRef(save)
  saveRef.current = save
  const saveFromShortcut = useCallback(() => {
    void saveRef.current()
  }, [])
  useSaveShortcut(isActive, saveFromShortcut)

  useEffect(() => {
    onDirtyChange?.(editor.dirty)
  }, [editor.dirty, onDirtyChange])

  useEffect(() => {
    if (!isActive) {
      return
    }
    onEditorBridgeChange?.({
      editor,
      onSave: () => {
        void save()
      },
    })
    return () => {
      onEditorBridgeChange?.({ editor: null, onSave: null })
    }
  }, [editor, isActive, onEditorBridgeChange, save])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          variant="plain"
          className={styles.openBtn}
          onClick={() => {
            void openWithDefaultApp(path).catch((err: unknown) => {
              window.alert(errorMessage(err, '既定のアプリで開けませんでした'))
            })
          }}
        >
          <ExternalLink size={12} aria-hidden="true" />
          既定のアプリで開く
        </Button>
      </div>
      <div className={styles.editorWrap}>
        <SqlCodeEditor
          path={path}
          initialContent={content}
          isActive={isActive}
          viewRef={viewRef}
          onDocChange={syncDirty}
        />
      </div>
    </div>
  )
}
