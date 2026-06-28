import { useMemo, useState } from 'react'
import { AlertTriangle, FileDiff, MinusCircle, PlusCircle } from 'lucide-react'

import {
  type FileDiffEntry,
  countEntries,
} from '../../hooks/useFolderDiff'
import { cx } from '../../utils/cx'
import { Button } from '../ui/Button'

import { DiffSideMark } from './DiffSideMark'
import styles from './FolderDiffView.module.css'

interface FolderDiffViewProps {
  leftLabel: string
  rightLabel: string
  entries: FileDiffEntry[]
  loading: boolean
  error: string | null
  onOpenFile: (entry: FileDiffEntry) => void
}

function rowClass(status: FileDiffEntry['status']): string | undefined {
  switch (status) {
    case 'changed':
      return styles.changed
    case 'added':
      return styles.added
    case 'removed':
      return styles.removed
    case 'error':
      return styles.errorRow
    default:
      return undefined
  }
}

function StatusIcon({ status }: { status: FileDiffEntry['status'] }) {
  switch (status) {
    case 'changed':
      return <FileDiff size={14} aria-hidden="true" />
    case 'added':
      return <PlusCircle size={14} aria-hidden="true" />
    case 'removed':
      return <MinusCircle size={14} aria-hidden="true" />
    case 'error':
      return <AlertTriangle size={14} aria-hidden="true" />
    default:
      return null
  }
}

export function FolderDiffView({
  leftLabel,
  rightLabel,
  entries,
  loading,
  error,
  onOpenFile,
}: FolderDiffViewProps) {
  const [showSame, setShowSame] = useState(false)

  const counts = useMemo(() => countEntries(entries), [entries])

  const visible = useMemo(
    () => (showSame ? entries : entries.filter((entry) => entry.status !== 'same')),
    [entries, showSame],
  )

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.summary}>
          <span className={styles.badgeChanged}>変更 {counts.changed}</span>
          <span className={styles.badgeAdded}>追加 {counts.added}</span>
          <span className={styles.badgeRemoved}>削除 {counts.removed}</span>
          <span className={styles.badgeSame}>一致 {counts.same}</span>
          {counts.error > 0 && (
            <span className={styles.badgeError}>エラー {counts.error}</span>
          )}
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showSame}
            onChange={(e) => setShowSame(e.target.checked)}
          />
          変更なしを表示
        </label>
      </div>

      <div className={styles.headRow}>
        <div className={styles.headCell} title={leftLabel}>
          <DiffSideMark side="left" />
          <span className={styles.headLabel}>{leftLabel}</span>
        </div>
        <div className={styles.headCell} title={rightLabel}>
          <DiffSideMark side="right" />
          <span className={styles.headLabel}>{rightLabel}</span>
        </div>
      </div>

      {loading && <p className={styles.empty}>比較中...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className={styles.empty}>
          {entries.length === 0
            ? '比較対象のファイルがありません。'
            : '差分のあるファイルはありません。'}
        </p>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className={styles.list}>
          {visible.map((entry) => {
            const clickable = entry.status !== 'error'
            return (
              <li key={entry.relPath}>
                <Button
                  variant="plain"
                  className={cx(styles.row, rowClass(entry.status))}
                  onClick={clickable ? () => onOpenFile(entry) : undefined}
                  disabled={!clickable}
                  title={entry.error ?? entry.relPath}
                >
                  <span className={styles.cell}>
                    {entry.leftPath ? (
                      <>
                        <span className={styles.icon}>
                          <StatusIcon status={entry.status} />
                        </span>
                        <span className={styles.label}>{entry.relPath}</span>
                      </>
                    ) : (
                      <span className={styles.placeholder}>—</span>
                    )}
                  </span>
                  <span className={styles.cell}>
                    {entry.rightPath ? (
                      <>
                        <span className={styles.icon}>
                          <StatusIcon status={entry.status} />
                        </span>
                        <span className={styles.label}>{entry.relPath}</span>
                      </>
                    ) : (
                      <span className={styles.placeholder}>—</span>
                    )}
                  </span>
                </Button>
                {entry.error && (
                  <p className={styles.rowError}>{entry.error}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
