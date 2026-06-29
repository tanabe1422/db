import { useEffect, useRef } from 'react'
import type { EditorView } from '@codemirror/view'
import {
  EditorView as createEditorView,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { EditorState, Prec } from '@codemirror/state'
import { sql } from '@codemirror/lang-sql'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  insertTab,
} from '@codemirror/commands'
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language'

import { sqlEditorTheme } from './sqlEditorTheme'
import styles from './TextFileView.module.css'

interface SqlCodeEditorProps {
  path: string
  initialContent: string
  isActive?: boolean
  viewRef: React.MutableRefObject<EditorView | null>
  onDocChange: () => void
  onSave: () => void
}

export function SqlCodeEditor({
  path,
  initialContent,
  isActive = true,
  viewRef,
  onDocChange,
  onSave,
}: SqlCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onDocChangeRef = useRef(onDocChange)
  const onSaveRef = useRef(onSave)
  onDocChangeRef.current = onDocChange
  onSaveRef.current = onSave

  useEffect(() => {
    const parent = containerRef.current
    if (!parent) {
      return
    }

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          onSaveRef.current()
          return true
        },
      },
    ])

    const tabKeymap = Prec.highest(
      keymap.of([
        {
          key: 'Tab',
          preventDefault: true,
          run: insertTab,
          shift: indentLess,
        },
      ]),
    )

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        lineNumbers(),
        history(),
        sql(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        saveKeymap,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        tabKeymap,
        sqlEditorTheme,
        createEditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onDocChangeRef.current()
          }
        }),
      ],
    })

    const view = new createEditorView({ state, parent })
    viewRef.current = view
    onDocChangeRef.current()

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !view.dom.contains(document.activeElement)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      if (event.shiftKey) {
        indentLess(view)
      } else {
        insertTab(view)
      }
    }
    parent.addEventListener('keydown', handleTabKey, true)

    return () => {
      parent.removeEventListener('keydown', handleTabKey, true)
      view.destroy()
      viewRef.current = null
    }
  }, [path, viewRef])

  useEffect(() => {
    if (!isActive) {
      return
    }
    const view = viewRef.current
    if (!view) {
      return
    }
    requestAnimationFrame(() => {
      viewRef.current?.focus()
    })
  }, [isActive, path, viewRef])

  return <div ref={containerRef} className={styles.editor} />
}
