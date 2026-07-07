import { useLayoutEffect, useRef } from 'react'

function syncRowHeights(
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

export function useSyncedTableRowHeights(
  leftRef: React.RefObject<HTMLDivElement | null>,
  rightRef: React.RefObject<HTMLDivElement | null>,
  deps: React.DependencyList,
) {
  const rafRef = useRef(0)

  useLayoutEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        syncRowHeights(leftRef.current, rightRef.current)
      })
    }

    schedule()

    const observer = new ResizeObserver(schedule)
    if (leftRef.current) {
      observer.observe(leftRef.current)
    }
    if (rightRef.current) {
      observer.observe(rightRef.current)
    }

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      const leftRows =
        leftRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr')
      const rightRows =
        rightRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr')
      leftRows?.forEach((row) => {
        row.style.height = ''
      })
      rightRows?.forEach((row) => {
        row.style.height = ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies meaningful deps
  }, deps)
}
