import { ArrowLeft } from 'lucide-react'

import { useSyncedHorizontalScroll } from '../../hooks/useSyncedHorizontalScroll'
import type { TableDiff } from '../../lib/diffTable'
import { Button } from '../ui/Button'

import { DiffMetaPanel } from './DiffMetaPanel'
import { DiffSideMark, diffSideAriaLabel } from './DiffSideMark'
import { DiffSideTable } from './DiffSideTable'
import styles from './FileDiffView.module.css'

interface FileDiffViewProps {
  relPath: string
  diff: TableDiff
  onBack: () => void
}

export function FileDiffView({ relPath, diff, onBack }: FileDiffViewProps) {
  const { leftRef, rightRef, onLeftScroll, onRightScroll } =
    useSyncedHorizontalScroll()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="plain" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          ファイル一覧に戻る
        </Button>
        <span className={styles.fileName} title={relPath}>
          {relPath}
        </span>
      </div>

      <div className={styles.split}>
        <div className={styles.pane}>
          <div className={styles.paneHead}>
            <DiffSideMark side="left" />
            <span>{diffSideAriaLabel('left')}</span>
          </div>
          <div className={styles.meta}>
            <DiffMetaPanel diff={diff} side="left" />
          </div>
          <DiffSideTable
            diff={diff}
            side="left"
            wrapperRef={leftRef}
            onScroll={onLeftScroll}
          />
        </div>
        <div className={styles.pane}>
          <div className={styles.paneHead}>
            <DiffSideMark side="right" />
            <span>{diffSideAriaLabel('right')}</span>
          </div>
          <div className={styles.meta}>
            <DiffMetaPanel diff={diff} side="right" />
          </div>
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
