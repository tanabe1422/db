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

export const ZOOM_CHANGE_EVENT = 'db-gui:zoom-change'

export function dispatchZoomChange() {
  window.dispatchEvent(new Event(ZOOM_CHANGE_EVENT))
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

/** Convert `getBoundingClientRect()` for portaled `position: fixed` overlays under app zoom. */
export function toFixedOverlayRect(
  rect: Pick<DOMRect, 'top' | 'left' | 'bottom' | 'width'>,
  gap = 2,
): { top: number; left: number; width: number } {
  const factor = getAppZoomFactor()
  return {
    top: (rect.bottom + gap) / factor,
    left: rect.left / factor,
    width: rect.width / factor,
  }
}

/** Anchor point below trigger center for portaled tooltips (`transform: translateX(-50%)`). */
export function toTooltipPosition(
  rect: Pick<DOMRect, 'left' | 'bottom' | 'width'>,
  gap = 6,
): { top: number; left: number } {
  const factor = getAppZoomFactor()
  return {
    top: (rect.bottom + gap) / factor,
    left: (rect.left + rect.width / 2) / factor,
  }
}

export type TooltipAlign = 'center' | 'start' | 'end'

export interface TooltipPosition {
  top: number
  left: number
  align: TooltipAlign
}

function fitsHorizontally(
  leftEdge: number,
  rightEdge: number,
  margin: number,
  viewportW: number,
): boolean {
  return leftEdge >= margin && rightEdge <= viewportW - margin
}

/** Pick horizontal anchor so the tooltip stays inside the viewport. */
export function computeTooltipHorizontalPosition(
  triggerRect: Pick<DOMRect, 'left' | 'width'>,
  tooltipWidth: number,
  margin = 8,
): { left: number; align: TooltipAlign } {
  const viewportW = window.innerWidth
  const triggerLeft = triggerRect.left
  const triggerRight = triggerRect.left + triggerRect.width
  const triggerCenter = triggerLeft + triggerRect.width / 2
  const halfW = tooltipWidth / 2

  const centerLeft = triggerCenter - halfW
  const centerRight = triggerCenter + halfW
  if (fitsHorizontally(centerLeft, centerRight, margin, viewportW)) {
    return { left: triggerCenter, align: 'center' }
  }

  const endRight = triggerRight
  const endLeft = endRight - tooltipWidth
  if (fitsHorizontally(endLeft, endRight, margin, viewportW)) {
    return { left: endRight, align: 'end' }
  }

  const startLeft = triggerLeft
  const startRight = startLeft + tooltipWidth
  if (fitsHorizontally(startLeft, startRight, margin, viewportW)) {
    return { left: startLeft, align: 'start' }
  }

  if (triggerCenter >= viewportW / 2) {
    const right = Math.min(triggerRight, viewportW - margin)
    return { left: Math.max(margin + tooltipWidth, right), align: 'end' }
  }

  const left = Math.max(triggerLeft, margin)
  return { left: Math.min(left, viewportW - margin - tooltipWidth), align: 'start' }
}

/** Clamp a portaled tooltip within the viewport (zoom-aware). */
export function computeTooltipPosition(
  triggerRect: Pick<DOMRect, 'top' | 'left' | 'bottom' | 'width'>,
  tooltipRect: Pick<DOMRect, 'width' | 'height'>,
  gap = 6,
  margin = 8,
): TooltipPosition {
  const factor = getAppZoomFactor()
  const viewportH = window.innerHeight

  const { left: leftViewport, align } = computeTooltipHorizontalPosition(
    triggerRect,
    tooltipRect.width,
    margin,
  )

  let topViewport = triggerRect.bottom + gap
  if (topViewport + tooltipRect.height > viewportH - margin) {
    topViewport = triggerRect.top - gap - tooltipRect.height
  }
  topViewport = Math.max(topViewport, margin)

  return {
    top: topViewport / factor,
    left: leftViewport / factor,
    align,
  }
}
