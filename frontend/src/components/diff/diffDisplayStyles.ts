import type { DisplayCol } from '../../lib/diffDisplayColumns'

import styles from './FileDiffView.module.css'

export function displayColClass(col: DisplayCol): string | undefined {
  if (col.kind === 'check') return styles.center
  if (col.kind === 'marker') return styles.markerCol
  if (col.id === 'name' || col.id === 'dataType') return styles.mono
  return undefined
}

export function highlightClass(
  highlight: 'changed' | 'added' | 'removed' | null,
): string | undefined {
  switch (highlight) {
    case 'changed':
      return styles.changedCell
    case 'added':
      return styles.addedCell
    case 'removed':
      return styles.removedCell
    default:
      return undefined
  }
}
