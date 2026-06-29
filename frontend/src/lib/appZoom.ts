export const ZOOM_STORAGE_KEY = 'db-gui:zoomLevel'
export const LEGACY_ZOOM_STORAGE_KEY = 'db-gui:zoom'
export const ZOOM_BASE = 1.2
export const MIN_ZOOM_LEVEL = -4
export const MAX_ZOOM_LEVEL = 6
export const DEFAULT_ZOOM_LEVEL = 0

export function clampZoomLevel(value: number): number {
  return Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, Math.round(value * 1000) / 1000))
}

export function levelToFactor(level: number): number {
  return Math.pow(ZOOM_BASE, level)
}

export function factorToLevel(factor: number): number {
  if (!Number.isFinite(factor) || factor <= 0) {
    return DEFAULT_ZOOM_LEVEL
  }
  return clampZoomLevel(Math.log(factor) / Math.log(ZOOM_BASE))
}

export function readStoredZoomLevel(): number {
  try {
    const rawLevel = localStorage.getItem(ZOOM_STORAGE_KEY)
    if (rawLevel) {
      const parsed = Number(rawLevel)
      if (Number.isFinite(parsed)) {
        return clampZoomLevel(parsed)
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_ZOOM_STORAGE_KEY)
    if (legacyRaw) {
      const legacyFactor = Number(legacyRaw)
      if (Number.isFinite(legacyFactor)) {
        return factorToLevel(legacyFactor)
      }
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_ZOOM_LEVEL
}

/** Active zoom factor (WebView native zoom or dev CSS zoom fallback). */
export function getAppZoomFactor(): number {
  const inlineZoom = document.documentElement.style.zoom
  if (inlineZoom) {
    const parsed = Number(inlineZoom)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }
  return levelToFactor(readStoredZoomLevel())
}

/** Convert viewport pointer coords for `position: fixed` menus under app zoom. */
export function toContextMenuPosition(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const factor = getAppZoomFactor()
  return {
    x: clientX / factor,
    y: clientY / factor,
  }
}
