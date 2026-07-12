import { cx } from '../../utils/cx'
import { IconButton } from '../ui/Button'

import { DiffSideMark } from './DiffSideMark'
import { diffSideAriaLabel } from './diffSide'
import styles from './DiffSetupPanel.module.css'

interface DiffSideAssignButtonsProps {
  isLeft: boolean
  isRight: boolean
  onSelectLeft: () => void
  onSelectRight: () => void
}

export function DiffSideAssignButtons({
  isLeft,
  isRight,
  onSelectLeft,
  onSelectRight,
}: DiffSideAssignButtonsProps) {
  return (
    <span className={styles.assign}>
      <IconButton
        variant="plain"
        size="sm"
        className={cx(styles.side, isLeft && styles.sideLeftActive)}
        onClick={onSelectLeft}
        aria-label={`${diffSideAriaLabel('left')}に指定`}
      >
        <DiffSideMark side="left" size="sm" />
      </IconButton>
      <IconButton
        variant="plain"
        size="sm"
        className={cx(styles.side, isRight && styles.sideRightActive)}
        onClick={onSelectRight}
        aria-label={`${diffSideAriaLabel('right')}に指定`}
      >
        <DiffSideMark side="right" size="sm" />
      </IconButton>
    </span>
  )
}
