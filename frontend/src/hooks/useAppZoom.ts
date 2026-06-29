import { useCallback, useEffect, useState } from 'react'

import { setZoomLevel as setNativeZoomLevel } from '../lib/wails'

const STORAGE_KEY = 'db-gui:zoomLevel'
const LEGACY_STORAGE_KEY = 'db-gui:zoom'
const ZOOM_BASE = 1.2
const MIN_LEVEL = -4
const MAX_LEVEL = 6
const DEFAULT_LEVEL = 0

function clampLevel(value: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(value * 1000) / 1000))
}

function levelToFactor(level: number): number {
  return Math.pow(ZOOM_BASE, level)
}

function factorToLevel(factor: number): number {
  if (!Number.isFinite(factor) || factor <= 0) {
    return DEFAULT_LEVEL
  }
  return clampLevel(Math.log(factor) / Math.log(ZOOM_BASE))
}

function readStoredLevel(): number {
  try {
    const rawLevel = localStorage.getItem(STORAGE_KEY)
    if (rawLevel) {
      const parsed = Number(rawLevel)
      if (Number.isFinite(parsed)) {
        return clampLevel(parsed)
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw) {
      const legacyFactor = Number(legacyRaw)
      if (Number.isFinite(legacyFactor)) {
        return factorToLevel(legacyFactor)
      }
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LEVEL
}

function writeStoredLevel(level: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(level))
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }
}

function applyDevZoom(level: number) {
  const factor = levelToFactor(level)
  document.documentElement.style.zoom = factor === 1 ? '' : String(factor)
}

async function applyZoom(level: number): Promise<number> {
  const value = clampLevel(level)
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
  const [zoomLevel, setZoomLevelState] = useState(readStoredLevel)

  const applyAndSet = useCallback(async (level: number) => {
    const applied = await applyZoom(level)
    setZoomLevelState(applied)
    return applied
  }, [])

  useEffect(() => {
    void applyAndSet(readStoredLevel())
  }, [applyAndSet])

  const setZoomLevel = useCallback(
    (next: number | ((prev: number) => number)) => {
      setZoomLevelState((prev) => {
        const value = clampLevel(typeof next === 'function' ? next(prev) : next)
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
    setZoomLevel(DEFAULT_LEVEL)
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
