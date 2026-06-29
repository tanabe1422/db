import type { DisplayCol } from '../../lib/diffDisplayColumns'
import grid from '../table/ColumnGridTable.module.css'

import styles from './FileDiffView.module.css'

export function displayColClass(col: DisplayCol): string | undefined {
  if (col.kind === 'check') return grid.center
  if (col.kind === 'marker') return grid.markerCol
  if (col.id === 'dataType') return grid.typeCell
  if (col.id === 'len' || col.id === 'scale') return grid.numCell
  if (col.id === 'remarks') return grid.remarks
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
