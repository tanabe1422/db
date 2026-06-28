import { useCallback, useEffect, useState } from 'react'
import type { Settings } from '../types'
import {
  addDirectory,
  getSettings,
  pickDirectory,
  removeDirectory,
  setActiveDirectory,
} from '../lib/wails'

export function useSettings(onSettingsChange?: (settings: Settings) => void) {
  const [settings, setSettings] = useState<Settings>({
    directories: [],
    activeDirectory: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getSettings()
      setSettings(next)
      onSettingsChange?.(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [onSettingsChange])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleAdd = useCallback(async () => {
    const path = await pickDirectory()
    if (!path) {
      return settings
    }
    const next = await addDirectory(path)
    setSettings(next)
    onSettingsChange?.(next)
    return next
  }, [onSettingsChange, settings])

  const handleRemove = useCallback(
    async (path: string) => {
      const next = await removeDirectory(path)
      setSettings(next)
      onSettingsChange?.(next)
      return next
    },
    [onSettingsChange],
  )

  const handleSetActive = useCallback(
    async (path: string) => {
      const next = await setActiveDirectory(path)
      setSettings(next)
      onSettingsChange?.(next)
      return next
    },
    [onSettingsChange],
  )

  return {
    settings,
    loading,
    error,
    refresh,
    addDirectory: handleAdd,
    removeDirectory: handleRemove,
    setActiveDirectory: handleSetActive,
  }
}
