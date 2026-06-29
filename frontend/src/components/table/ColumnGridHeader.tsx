import { cx } from '../../utils/cx'
import { Tooltip } from '../ui/Tooltip'
import {
  GRID_COLUMNS,
  IDENTITY_COLUMN_TITLE,
  NOT_NULL_LABEL,
  NOT_NULL_TITLE,
  UNIQUE_CONSTRAINT_LABEL,
  UNIQUE_CONSTRAINT_TITLE,
  UNIQUE_INDEX_GROUP_LABEL,
  UNIQUE_INDEX_GROUP_TITLE,
} from '../../lib/gridColumns'
import {
  MAX_INDEXES,
  MAX_UNIQUE_CONSTRAINTS,
  MAX_UNIQUE_INDEXES,
} from '../../utils/columnMeta'
import {
  indexNumbers,
  uniqueIndexNumbers,
  uniqueNumbers,
} from './navColumns'

import grid from './ColumnGridTable.module.css'

export const ROW_NUMBER_LABEL = 'No'

const TAIL_COLUMNS = GRID_COLUMNS.filter(
  (column) => column.role === 'key' || column.role === 'text',
)

interface ColumnGridHeaderProps {
  showActionsColumn?: boolean
  actionsColClass?: string
  remarksExtraClass?: string
  dataTypeColClass?: string
}

function tailHeaderClass(
  colId: string,
  remarksExtraClass?: string,
  dataTypeColClass?: string,
): string | undefined {
  switch (colId) {
    case 'dataType':
      return dataTypeColClass ?? grid.typeCell
    case 'len':
    case 'scale':
      return grid.numCell
    case 'remarks':
      return cx(grid.remarks, remarksExtraClass)
    default:
      return undefined
  }
}

export function ColumnGridHeader({
  showActionsColumn = false,
  actionsColClass,
  remarksExtraClass,
  dataTypeColClass,
}: ColumnGridHeaderProps) {
  return (
    <>
      <tr>
        {showActionsColumn && (
          <th
            className={cx(grid.center, grid.fixedCol, actionsColClass)}
            rowSpan={2}
          >
            操作
          </th>
        )}
        <th
          className={cx(
            grid.center,
            grid.fixedCol,
            grid.gridLabel,
            grid.rowNumHeader,
          )}
          rowSpan={2}
        >
          {ROW_NUMBER_LABEL}
        </th>
        <th
          className={cx(grid.center, grid.fixedCol, grid.gridLabel)}
          rowSpan={2}
        >
          PK
        </th>
        <Tooltip content={UNIQUE_INDEX_GROUP_TITLE}>
          <th
            className={cx(grid.center, grid.groupHeader, grid.gridLabel)}
            colSpan={MAX_UNIQUE_INDEXES}
          >
            {UNIQUE_INDEX_GROUP_LABEL}
          </th>
        </Tooltip>
        <th
          className={cx(grid.center, grid.gridLabel)}
          colSpan={MAX_INDEXES}
        >
          Index
        </th>
        <Tooltip content={IDENTITY_COLUMN_TITLE}>
          <th
            className={cx(grid.center, grid.fixedCol, grid.gridLabel)}
            rowSpan={2}
          >
            ID
          </th>
        </Tooltip>
        <Tooltip content={UNIQUE_CONSTRAINT_TITLE}>
          <th
            className={cx(grid.center, grid.gridLabel)}
            colSpan={MAX_UNIQUE_CONSTRAINTS}
          >
            {UNIQUE_CONSTRAINT_LABEL}
          </th>
        </Tooltip>
        <Tooltip content={NOT_NULL_TITLE}>
          <th
            className={cx(grid.center, grid.fixedCol, grid.gridLabel)}
            rowSpan={2}
          >
            {NOT_NULL_LABEL}
          </th>
        </Tooltip>
        {TAIL_COLUMNS.map((column) => (
          <th
            key={column.id}
            rowSpan={2}
            className={tailHeaderClass(column.id, remarksExtraClass, dataTypeColClass)}
          >
            {column.label}
          </th>
        ))}
      </tr>
      <tr>
        {uniqueIndexNumbers.map((number) => (
          <th key={`uidx${number}`} className={cx(grid.markerCol, grid.gridLabel)}>
            {number}
          </th>
        ))}
        {indexNumbers.map((number) => (
          <th key={`idx${number}`} className={cx(grid.markerCol, grid.gridLabel)}>
            {number}
          </th>
        ))}
        {uniqueNumbers.map((number) => (
          <th key={`uq${number}`} className={cx(grid.markerCol, grid.gridLabel)}>
            {number}
          </th>
        ))}
      </tr>
    </>
  )
}
