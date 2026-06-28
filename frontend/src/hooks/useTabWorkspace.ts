import { useCallback, useState } from 'react'

export function useTabWorkspace() {
  const [openPaths, setOpenPaths] = useState<string[]>([])
  const [activePath, setActivePath] = useState('')
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set())
  const [closingPath, setClosingPath] = useState<string | null>(null)

  const handleSelectFile = useCallback((path: string) => {
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActivePath(path)
  }, [])

  const updateDirty = useCallback((path: string, dirty: boolean) => {
    setDirtyPaths((prev) => {
      if (prev.has(path) === dirty) {
        return prev
      }
      const next = new Set(prev)
      if (dirty) {
        next.add(path)
      } else {
        next.delete(path)
      }
      return next
    })
  }, [])

  const closeTab = useCallback((path: string) => {
    setOpenPaths((prev) => {
      const idx = prev.indexOf(path)
      const next = prev.filter((p) => p !== path)
      setActivePath((current) => {
        if (current !== path) {
          return current
        }
        return next.length === 0 ? '' : next[Math.min(idx, next.length - 1)]
      })
      return next
    })
    setDirtyPaths((prev) => {
      if (!prev.has(path)) {
        return prev
      }
      const cloned = new Set(prev)
      cloned.delete(path)
      return cloned
    })
  }, [])

  const handleRequestClose = useCallback(
    (path: string) => {
      if (dirtyPaths.has(path)) {
        setClosingPath(path)
      } else {
        closeTab(path)
      }
    },
    [closeTab, dirtyPaths],
  )

  const handleConfirmClose = useCallback(() => {
    if (closingPath) {
      closeTab(closingPath)
    }
    setClosingPath(null)
  }, [closeTab, closingPath])

  const handleCancelClose = useCallback(() => {
    setClosingPath(null)
  }, [])

  const resetTabs = useCallback(() => {
    setOpenPaths([])
    setActivePath('')
    setDirtyPaths(new Set())
    setClosingPath(null)
  }, [])

  return {
    openPaths,
    activePath,
    dirtyPaths,
    closingPath,
    setActivePath,
    handleSelectFile,
    updateDirty,
    handleRequestClose,
    handleConfirmClose,
    handleCancelClose,
    resetTabs,
  }
}
