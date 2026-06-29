import { EditorView } from '@codemirror/view'

export const sqlEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--font-size-marker)',
    backgroundColor: 'var(--color-white)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily:
      "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-slate-50)',
    color: 'var(--color-slate-400)',
    borderRight: '1px solid var(--color-slate-200)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--color-slate-100)',
    color: 'var(--color-slate-600)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-slate-900)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--color-blue-100) !important',
  },
})
