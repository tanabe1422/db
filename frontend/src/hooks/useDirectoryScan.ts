import { useCallback, useEffect, useState } from 'react'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import type { Settings, TreeNode } from '../types'
import { errorMessage } from '../lib/errorMessage'
import { isWailsRuntime, scanActiveDirectory, startDirectoryWatch } from '../lib/wails'

const RESCAN_DEBOUNCE_MS = 300

export function useDirectoryScan(activeDirectory: string) {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (options?: { silent?: boolean }) => {
    if (!activeDirectory) {
      setTree(null)
      setError(null)
      return
    }

    if (!options?.silent) {
      setLoading(true)
    }
    setError(null)
    try {
      const result = await scanActiveDirectory()
      setTree(result)
    } catch (err) {
      setError(errorMessage(err, 'スキャンに失敗しました'))
      setTree(null)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [activeDirectory])

  useEffect(() => {
    void scan()
  }, [scan])

  useEffect(() => {
    void startDirectoryWatch(activeDirectory)
  }, [activeDirectory])

  useEffect(() => {
    if (!isWailsRuntime()) {
      return
    }

    let timeout: number | undefined
    const unsubscribe = EventsOn('directory:changed', () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        void scan({ silent: true })
      }, RESCAN_DEBOUNCE_MS)
    })
    return () => {
      unsubscribe()
      window.clearTimeout(timeout)
    }
  }, [scan])

  return { tree, loading, error, rescan: scan }
}

export function useDirectoryScanFromSettings(settings: Settings) {
  return useDirectoryScan(settings.activeDirectory)
}
