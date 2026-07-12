import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { redo, redoDepth, undo, undoDepth } from '@codemirror/commands'

import type { ToolbarEditor } from '../components/toolbar/editorToolbarBridge'
import { errorMessage } from '../lib/errorMessage'
import {
  detectLineEnding,
  fromEditorText,
  toEditorText,
  type LineEnding,
} from '../lib/textLineEndings'
import { writeTextFile } from '../lib/wails'

export function useTextFileEditor(path: string, initialContent: string) {
  const viewRef = useRef<EditorView | null>(null)
  const savedContentRef = useRef(toEditorText(initialContent))
  const lineEndingRef = useRef<LineEnding>(detectLineEnding(initialContent))
  const [revision, setRevision] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const editorText = toEditorText(initialContent)
    savedContentRef.current = editorText
    lineEndingRef.current = detectLineEnding(initialContent)
    setDirty(false)
    setSaveError(null)

    const view = viewRef.current
    if (view && view.state.doc.toString() !== editorText) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: editorText },
      })
    }
  }, [initialContent, path])

  const syncDirty = useCallback(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    setDirty(view.state.doc.toString() !== savedContentRef.current)
    setRevision((value) => value + 1)
  }, [])

  const save = useCallback(async () => {
    const view = viewRef.current
    if (!view || saving) {
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const editorText = view.state.doc.toString()
      const content = fromEditorText(editorText, lineEndingRef.current)
      await writeTextFile(path, content)
      savedContentRef.current = editorText
      setDirty(false)
    } catch (err) {
      setSaveError(
        errorMessage(err, '保存に失敗しました'),
      )
    } finally {
      setSaving(false)
    }
  }, [path, saving])

  const undoEdit = useCallback(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    undo(view)
    syncDirty()
  }, [syncDirty])

  const redoEdit = useCallback(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    redo(view)
    syncDirty()
  }, [syncDirty])

  const editor: ToolbarEditor = useMemo(() => {
    void revision
    const view = viewRef.current
    return {
      dirty,
      saving,
      saveError,
      canUndo: view ? undoDepth(view.state) > 0 : false,
      canRedo: view ? redoDepth(view.state) > 0 : false,
      undo: undoEdit,
      redo: redoEdit,
    }
  }, [dirty, saving, saveError, undoEdit, redoEdit, revision])

  return {
    viewRef,
    editor,
    save,
    syncDirty,
  }
}
