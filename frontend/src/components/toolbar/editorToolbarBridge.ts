export interface ToolbarEditor {
  dirty: boolean
  saving: boolean
  saveError: string | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

export interface EditorToolbarBridge {
  editor: ToolbarEditor | null
  onSave: (() => void) | null
}

export const emptyEditorToolbarBridge: EditorToolbarBridge = {
  editor: null,
  onSave: null,
}
