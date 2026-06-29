import { useCallback, useEffect, useRef, useState } from 'react'

import type { FileStat } from '../lib/wails'
import { getFileStat } from '../lib/wails'

const POLL_INTERVAL_MS = 2_000

interface UseExternalFileChangeOptions {
  path: string
  dirty: boolean
  enabled?: boolean
  onReload: (silent?: boolean) => Promise<void>
}

function statKey(stat: FileStat): string {
  return `${stat.modTimeUnixNano}:${stat.size}`
}

export function useExternalFileChange({
  path,
  dirty,
  enabled = true,
  onReload,
}: UseExternalFileChangeOptions) {
  const baselineRef = useRef<FileStat | null>(null)
  const ignoredKeyRef = useRef<string | null>(null)
  const dialogOpenRef = useRef(false)
  const onReloadRef = useRef(onReload)
  const [dialogOpen, setDialogOpen] = useState(false)

  onReloadRef.current = onReload

  const syncBaseline = useCallback(async () => {
    if (!path) {
      baselineRef.current = null
      return
    }
    try {
      baselineRef.current = await getFileStat(path)
      ignoredKeyRef.current = null
    } catch {
      baselineRef.current = null
    }
  }, [path])

  useEffect(() => {
    void syncBaseline()
  }, [path, syncBaseline])

  useEffect(() => {
    if (!dirty) {
      void syncBaseline()
    }
  }, [dirty, syncBaseline])

  const handleReload = useCallback(async () => {
    dialogOpenRef.current = false
    setDialogOpen(false)
    await onReloadRef.current(false)
    await syncBaseline()
  }, [syncBaseline])

  const handleIgnore = useCallback(async () => {
    dialogOpenRef.current = false
    setDialogOpen(false)
    try {
      const stat = await getFileStat(path)
      ignoredKeyRef.current = statKey(stat)
    } catch {
      ignoredKeyRef.current = null
    }
  }, [path])

  const handleCancel = useCallback(() => {
    dialogOpenRef.current = false
    setDialogOpen(false)
  }, [])

  useEffect(() => {
    if (!enabled || !path) {
      return
    }

    let cancelled = false

    const tick = async () => {
      if (cancelled || dialogOpenRef.current) {
        return
      }

      const baseline = baselineRef.current
      if (!baseline) {
        return
      }

      let current: FileStat
      try {
        current = await getFileStat(path)
      } catch {
        return
      }

      if (!fileStatChanged(baseline, current)) {
        return
      }

      const currentKey = statKey(current)
      if (ignoredKeyRef.current === currentKey) {
        return
      }

      if (!dirty) {
        await onReloadRef.current(true)
        if (!cancelled) {
          baselineRef.current = current
          ignoredKeyRef.current = null
        }
        return
      }

      dialogOpenRef.current = true
      setDialogOpen(true)
    }

    const id = window.setInterval(() => {
      void tick()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [dirty, enabled, path])

  return {
    dialogOpen,
    handleReload,
    handleIgnore,
    handleCancel,
  }
}

function fileStatChanged(a: FileStat, b: FileStat): boolean {
  return a.modTimeUnixNano !== b.modTimeUnixNano || a.size !== b.size
}
