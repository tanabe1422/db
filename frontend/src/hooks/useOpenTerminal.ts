import { useCallback, useEffect } from 'react'

import { errorMessage } from '../lib/errorMessage'
import { openTerminal } from '../lib/wails'

function reportError(err: unknown): void {
  window.alert(errorMessage(err, 'ターミナルを開けませんでした'))
}

function isTerminalShortcut(event: KeyboardEvent): boolean {
  if (event.isComposing || !event.ctrlKey || event.metaKey || event.altKey) {
    return false
  }
  // JIS: 数字1の左の @ キー（Backquote / VK_OEM_3）
  return (
    event.key === '@' ||
    event.code === 'Backquote' ||
    event.keyCode === 192
  )
}

export function useOpenTerminal(directory: string) {
  const open = useCallback(() => {
    if (!directory) {
      window.alert('作業ディレクトリを設定してください')
      return
    }
    void openTerminal(directory).catch(reportError)
  }, [directory])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isTerminalShortcut(event)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      open()
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  return open
}
