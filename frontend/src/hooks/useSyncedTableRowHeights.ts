import { useLayoutEffect, useRef } from 'react'

/** Wait until resize bursts (sidebar width transition / drag) settle. */
export const RESIZE_SYNC_DEBOUNCE_MS = 100

export function syncRowHeights(
  leftRoot: HTMLDivElement | null,
  rightRoot: HTMLDivElement | null,
) {
  const leftRows = leftRoot?.querySelectorAll<HTMLTableRowElement>('tbody tr')
  const rightRows = rightRoot?.querySelectorAll<HTMLTableRowElement>('tbody tr')
  if (!leftRows?.length || !rightRows?.length) {
    return
  }

  const count = Math.min(leftRows.length, rightRows.length)
  for (let i = 0; i < count; i++) {
    leftRows[i].style.height = ''
    rightRows[i].style.height = ''
  }

  for (let i = 0; i < count; i++) {
    const left = leftRows[i]
    const right = rightRows[i]
    const height = Math.max(left.offsetHeight, right.offsetHeight)
    left.style.height = `${height}px`
    right.style.height = `${height}px`
  }
}

function clearRowHeights(root: HTMLDivElement | null) {
  root
    ?.querySelectorAll<HTMLTableRowElement>('tbody tr')
    .forEach((row) => {
      row.style.height = ''
    })
}

export function useSyncedTableRowHeights(
  leftRef: React.RefObject<HTMLDivElement | null>,
  rightRef: React.RefObject<HTMLDivElement | null>,
  deps: React.DependencyList,
) {
  const rafRef = useRef(0)
  const debounceRef = useRef(0)

  useLayoutEffect(() => {
    const runSync = () => {
      syncRowHeights(leftRef.current, rightRef.current)
    }

    const scheduleImmediate = () => {
      window.clearTimeout(debounceRef.current)
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(runSync)
    }

    // Coalesce ResizeObserver bursts from width animations / drag-resize.
    const scheduleDebounced = () => {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(scheduleImmediate, RESIZE_SYNC_DEBOUNCE_MS)
    }

    scheduleImmediate()

    const observer = new ResizeObserver(scheduleDebounced)
    if (leftRef.current) {
      observer.observe(leftRef.current)
    }
    if (rightRef.current) {
      observer.observe(rightRef.current)
    }

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(debounceRef.current)
      clearRowHeights(leftRef.current)
      clearRowHeights(rightRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies meaningful deps
  }, deps)
}
