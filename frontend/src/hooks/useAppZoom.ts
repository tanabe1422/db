import { useCallback, useEffect, useState } from 'react'

import {
  clampZoomLevel,
  DEFAULT_ZOOM_LEVEL,
  dispatchZoomChange,
  levelToFactor,
  readStoredZoomLevel,
  ZOOM_STORAGE_KEY,
  LEGACY_ZOOM_STORAGE_KEY,
} from '../lib/appZoom'
import { setZoomLevel as setNativeZoomLevel } from '../lib/wails'

function writeStoredLevel(level: number) {
  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(level))
    localStorage.removeItem(LEGACY_ZOOM_STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }
}

function applyDevZoom(level: number) {
  const factor = levelToFactor(level)
  document.documentElement.style.zoom = factor === 1 ? '' : String(factor)
}

async function applyZoom(level: number): Promise<number> {
  const value = clampZoomLevel(level)
  try {
    const applied = await setNativeZoomLevel(value)
    writeStoredLevel(applied)
    return applied
  } catch {
    applyDevZoom(value)
    writeStoredLevel(value)
    return value
  }
}

function hasZoomModifier(event: KeyboardEvent | WheelEvent): boolean {
  return event.ctrlKey || event.metaKey
}

function isZoomInKey(event: KeyboardEvent): boolean {
  return (
    event.key === '=' ||
    event.key === '+' ||
    event.code === 'Equal' ||
    event.code === 'NumpadAdd'
  )
}

function isZoomOutKey(event: KeyboardEvent): boolean {
  return (
    event.key === '-' ||
    event.key === '_' ||
    event.code === 'Minus' ||
    event.code === 'NumpadSubtract'
  )
}

function isZoomResetKey(event: KeyboardEvent): boolean {
  return event.key === '0' && (event.code === 'Digit0' || event.code === 'Numpad0')
}

export function useAppZoom() {
  const [zoomLevel, setZoomLevelState] = useState(readStoredZoomLevel)

  const applyAndSet = useCallback(async (level: number) => {
    const applied = await applyZoom(level)
    setZoomLevelState(applied)
    dispatchZoomChange()
    return applied
  }, [])

  useEffect(() => {
    void applyAndSet(readStoredZoomLevel())
  }, [applyAndSet])

  const setZoomLevel = useCallback(
    (next: number | ((prev: number) => number)) => {
      setZoomLevelState((prev) => {
        const value = clampZoomLevel(typeof next === 'function' ? next(prev) : next)
        void applyAndSet(value)
        return value
      })
    },
    [applyAndSet],
  )

  const zoomIn = useCallback(() => {
    setZoomLevel((current) => current + 1)
  }, [setZoomLevel])

  const zoomOut = useCallback(() => {
    setZoomLevel((current) => current - 1)
  }, [setZoomLevel])

  const resetZoom = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM_LEVEL)
  }, [setZoomLevel])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!hasZoomModifier(event)) {
        return
      }

      if (isZoomInKey(event)) {
        event.preventDefault()
        zoomIn()
        return
      }

      if (isZoomOutKey(event)) {
        event.preventDefault()
        zoomOut()
        return
      }

      if (isZoomResetKey(event)) {
        event.preventDefault()
        resetZoom()
      }
    }

    function onWheel(event: WheelEvent) {
      if (!hasZoomModifier(event)) {
        return
      }

      event.preventDefault()
      if (event.deltaY < 0) {
        zoomIn()
      } else if (event.deltaY > 0) {
        zoomOut()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('wheel', onWheel, { passive: false, capture: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('wheel', onWheel, { capture: true })
    }
  }, [zoomIn, zoomOut, resetZoom])

  return { zoomLevel, zoomIn, zoomOut, resetZoom, setZoomLevel }
}
