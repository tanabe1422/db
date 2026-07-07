import grid from '../table/ColumnGridTable.module.css'

/** 片側空行セルの最低行高を、通常セルの cellText と揃える */
export function DiffEmptyCellContent() {
  return (
    <span className={grid.cellText} aria-hidden="true">
      {'\u00a0'}
    </span>
  )
}
