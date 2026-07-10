import { useEffect } from 'react'

function isSaveShortcut(event: KeyboardEvent): boolean {
  if (event.isComposing) {
    return false
  }
  const mod = event.ctrlKey || event.metaKey
  return mod && (event.key === 's' || event.key === 'S')
}

/** アクティブなエディタで、フォーカス位置に関わらず Ctrl+S / Cmd+S を処理する。 */
export function useSaveShortcut(
  enabled: boolean,
  onSave: (() => void) | null | undefined,
) {
  useEffect(() => {
    if (!enabled || onSave == null) {
      return
    }
    const saveHandler: () => void = onSave

    function handleKeyDown(event: KeyboardEvent) {
      if (!isSaveShortcut(event)) {
        return
      }
      event.preventDefault()
      saveHandler()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onSave])
}
