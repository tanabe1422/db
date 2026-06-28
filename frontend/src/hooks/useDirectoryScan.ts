import { useCallback, useEffect, useState } from 'react'
import type { Settings, TreeNode } from '../types'
import { scanActiveDirectory } from '../lib/wails'

export function useDirectoryScan(activeDirectory: string) {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async () => {
    if (!activeDirectory) {
      setTree(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await scanActiveDirectory()
      setTree(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スキャンに失敗しました')
      setTree(null)
    } finally {
      setLoading(false)
    }
  }, [activeDirectory])

  useEffect(() => {
    void scan()
  }, [scan])

  return { tree, loading, error, rescan: scan }
}

export function useDirectoryScanFromSettings(settings: Settings) {
  return useDirectoryScan(settings.activeDirectory)
}
