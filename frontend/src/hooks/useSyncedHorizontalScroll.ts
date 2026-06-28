import { useRef } from 'react'

export function useSyncedHorizontalScroll() {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  function onLeftScroll() {
    if (syncingRef.current) return
    syncingRef.current = true
    if (rightRef.current && leftRef.current) {
      rightRef.current.scrollLeft = leftRef.current.scrollLeft
    }
    syncingRef.current = false
  }

  function onRightScroll() {
    if (syncingRef.current) return
    syncingRef.current = true
    if (leftRef.current && rightRef.current) {
      leftRef.current.scrollLeft = rightRef.current.scrollLeft
    }
    syncingRef.current = false
  }

  return { leftRef, rightRef, onLeftScroll, onRightScroll }
}
