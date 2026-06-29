import { ArrowLeft } from 'lucide-react'

import { useMouseBackButton } from '../../hooks/useMouseBackButton'
import { useSyncedHorizontalScroll } from '../../hooks/useSyncedHorizontalScroll'
import type { TableDiff } from '../../lib/diffTable'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

import { DiffMetaCompare } from './DiffMetaCompare'
import { DiffSideMark, diffSideAriaLabel } from './DiffSideMark'
import { DiffSideTable } from './DiffSideTable'
import styles from './FileDiffView.module.css'

interface FileDiffViewProps {
  relPath: string
  diff: TableDiff
  onBack: () => void
}

export function FileDiffView({ relPath, diff, onBack }: FileDiffViewProps) {
  useMouseBackButton(onBack)

  const { leftRef, rightRef, onLeftScroll, onRightScroll } =
    useSyncedHorizontalScroll()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="plain" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          ファイル一覧に戻る
        </Button>
        <Tooltip content={relPath} wrap>
          <span className={styles.fileName}>{relPath}</span>
        </Tooltip>
      </div>

      <div className={styles.diffBody}>
        <div className={styles.splitRow}>
          <div className={styles.paneHead}>
            <DiffSideMark side="left" />
            <span>{diffSideAriaLabel('left')}</span>
          </div>
          <div className={styles.paneHead}>
            <DiffSideMark side="right" />
            <span>{diffSideAriaLabel('right')}</span>
          </div>
        </div>

        <DiffMetaCompare diff={diff} />

        <div className={styles.splitRow}>
          <DiffSideTable
            diff={diff}
            side="left"
            wrapperRef={leftRef}
            onScroll={onLeftScroll}
          />
          <DiffSideTable
            diff={diff}
            side="right"
            wrapperRef={rightRef}
            onScroll={onRightScroll}
          />
        </div>
      </div>
    </div>
  )
}
