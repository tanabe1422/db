import { useCallback, useState } from 'react'

import type { DiffTabSource, WorkspaceTab } from '../types/workspaceTab'
import {
  diffTabIdFromFiles,
  diffTabIdFromInline,
  diffTabLabel,
} from '../types/workspaceTab'

export function useTabWorkspace() {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([])
  const [activeTabId, setActiveTabId] = useState('')
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set())
  const [closingTabId, setClosingTabId] = useState<string | null>(null)

  const handleSelectFile = useCallback((path: string) => {
    setTabs((prev) => {
      const existing = prev.find((tab) => tab.kind === 'file' && tab.path === path)
      if (existing) {
        return prev
      }
      return [...prev, { kind: 'file', id: path, path }]
    })
    setActiveTabId(path)
  }, [])

  const handleOpenDiffTab = useCallback((source: DiffTabSource, label: string) => {
    const id =
      source.type === 'files'
        ? diffTabIdFromFiles(source.leftPath, source.rightPath)
        : diffTabIdFromInline(source.leftJson, source.rightJson)
    const tabLabel = diffTabLabel(label)

    setTabs((prev) => {
      const existing = prev.find((tab) => tab.id === id)
      if (existing) {
        return prev
      }
      return [...prev, { kind: 'diff', id, label: tabLabel, relPath: label, source }]
    })
    setActiveTabId(id)
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

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((tab) => tab.id === tabId)
      const next = prev.filter((tab) => tab.id !== tabId)
      setActiveTabId((current) => {
        if (current !== tabId) {
          return current
        }
        return next.length === 0 ? '' : next[Math.min(idx, next.length - 1)].id
      })
      return next
    })
    setDirtyPaths((prev) => {
      if (!prev.has(tabId)) {
        return prev
      }
      const cloned = new Set(prev)
      cloned.delete(tabId)
      return cloned
    })
  }, [])

  const handleRequestClose = useCallback(
    (tabId: string) => {
      const tab = tabs.find((item) => item.id === tabId)
      if (tab?.kind === 'file' && dirtyPaths.has(tab.path)) {
        setClosingTabId(tabId)
        return
      }
      closeTab(tabId)
    },
    [closeTab, dirtyPaths, tabs],
  )

  const handleConfirmClose = useCallback(() => {
    if (closingTabId) {
      closeTab(closingTabId)
    }
    setClosingTabId(null)
  }, [closeTab, closingTabId])

  const handleCancelClose = useCallback(() => {
    setClosingTabId(null)
  }, [])

  const resetTabs = useCallback(() => {
    setTabs([])
    setActiveTabId('')
    setDirtyPaths(new Set())
    setClosingTabId(null)
  }, [])

  const closeAllSavedTabs = useCallback(() => {
    setTabs((prev) => {
      const next = prev.filter(
        (tab) => tab.kind === 'diff' || dirtyPaths.has(tab.path),
      )
      setActiveTabId((current) =>
        next.some((tab) => tab.id === current) ? current : next.at(-1)?.id ?? '',
      )
      return next
    })
  }, [dirtyPaths])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null
  const activeFilePath = activeTab?.kind === 'file' ? activeTab.path : ''
  const openPaths = tabs
    .filter((tab): tab is Extract<WorkspaceTab, { kind: 'file' }> => tab.kind === 'file')
    .map((tab) => tab.path)

  return {
    tabs,
    activeTabId,
    activeTab,
    activeFilePath,
    openPaths,
    activePath: activeFilePath,
    dirtyPaths,
    closingTabId,
    closingPath:
      closingTabId && tabs.find((tab) => tab.id === closingTabId)?.kind === 'file'
        ? closingTabId
        : null,
    setActiveTabId,
    setActivePath: setActiveTabId,
    handleSelectFile,
    handleOpenDiffTab,
    updateDirty,
    handleRequestClose,
    handleConfirmClose,
    handleCancelClose,
    resetTabs,
    closeAllSavedTabs,
  }
}
