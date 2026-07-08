import { useEffect, useRef } from 'react'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import type { LaunchAction } from '../lib/wails'
import {
  getLaunchActions,
  grantExternalFile,
  isWailsRuntime,
} from '../lib/wails'
import type { DiffTabSource } from '../types/workspaceTab'

interface UseLaunchActionsOptions {
  onOpenFile: (path: string) => void
  onOpenDiffTab: (source: DiffTabSource, label: string) => void
  setMode: (mode: 'edit') => void
}

function launchActionToDiffSource(action: LaunchAction): DiffTabSource | null {
  if (action.type === 'diff-files' && action.paths && action.paths.length >= 2) {
    return {
      type: 'files',
      leftPath: action.paths[0],
      rightPath: action.paths[1],
    }
  }
  if (action.type === 'diff-preview' && action.left && action.right) {
    return {
      type: 'inline',
      leftJson: action.left,
      rightJson: action.right,
    }
  }
  return null
}

async function openExternalFile(
  path: string,
  onOpenFile: (path: string) => void,
  setMode: (mode: 'edit') => void,
) {
  await grantExternalFile(path)
  setMode('edit')
  onOpenFile(path)
}

async function openExternalDiff(
  action: LaunchAction,
  onOpenDiffTab: (source: DiffTabSource, label: string) => void,
  setMode: (mode: 'edit') => void,
) {
  const source = launchActionToDiffSource(action)
  if (!source) {
    return
  }

  if (source.type === 'files') {
    await Promise.all([
      grantExternalFile(source.leftPath),
      grantExternalFile(source.rightPath),
    ])
  }

  setMode('edit')
  const label =
    action.label ||
    (source.type === 'files'
      ? source.rightPath.split(/[\\/]/).pop() || 'diff'
      : 'diff')
  onOpenDiffTab(source, label)
}

async function handleLaunchAction(
  action: LaunchAction,
  onOpenFile: (path: string) => void,
  onOpenDiffTab: (source: DiffTabSource, label: string) => void,
  setMode: (mode: 'edit') => void,
) {
  if (action.type === 'open' && action.paths?.[0]) {
    await openExternalFile(action.paths[0], onOpenFile, setMode)
    return
  }
  if (action.type === 'diff-files' || action.type === 'diff-preview') {
    await openExternalDiff(action, onOpenDiffTab, setMode)
  }
}

export function useLaunchActions({
  onOpenFile,
  onOpenDiffTab,
  setMode,
}: UseLaunchActionsOptions) {
  const onOpenFileRef = useRef(onOpenFile)
  const onOpenDiffTabRef = useRef(onOpenDiffTab)
  const setModeRef = useRef(setMode)
  onOpenFileRef.current = onOpenFile
  onOpenDiffTabRef.current = onOpenDiffTab
  setModeRef.current = setMode

  useEffect(() => {
    if (!isWailsRuntime()) {
      return
    }

    const handleFileOpen = (path: string) => {
      void openExternalFile(path, onOpenFileRef.current, setModeRef.current)
    }

    const handleDiffOpen = (action: LaunchAction) => {
      void openExternalDiff(action, onOpenDiffTabRef.current, setModeRef.current)
    }

    const unsubscribeFile = EventsOn('file:open', handleFileOpen)
    const unsubscribeDiff = EventsOn('diff:open', handleDiffOpen)

    void getLaunchActions().then((actions) => {
      for (const action of actions) {
        void handleLaunchAction(
          action,
          onOpenFileRef.current,
          onOpenDiffTabRef.current,
          setModeRef.current,
        )
      }
    })

    return () => {
      unsubscribeFile()
      unsubscribeDiff()
    }
  }, [])
}
