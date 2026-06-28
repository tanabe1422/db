import { ArrowLeft } from 'lucide-react'

import type { GitCommit } from '../../types'
import { useGitCommits } from '../../hooks/useGitDiff'
import { cx } from '../../utils/cx'
import { truncateMiddle } from '../../utils/truncateMiddle'
import { Button, IconButton } from '../ui/Button'

import { DiffSideMark, diffSideAriaLabel } from './DiffSideMark'
import setupStyles from './DiffSetupPanel.module.css'
import styles from './GitDiffSetupPanel.module.css'

interface GitDiffSetupPanelProps {
  activeDirectory: string
  leftHash?: string
  rightHash?: string
  onSelectLeft: (commit: GitCommit) => void
  onSelectRight: (commit: GitCommit) => void
  onExitGitDiff: () => void
}

function formatCommitDate(date: string): string {
  const parsed = Date.parse(date)
  if (Number.isNaN(parsed)) {
    return date
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function CommitRow({
  commit,
  leftHash,
  rightHash,
  onSelectLeft,
  onSelectRight,
}: {
  commit: GitCommit
  leftHash?: string
  rightHash?: string
  onSelectLeft: (commit: GitCommit) => void
  onSelectRight: (commit: GitCommit) => void
}) {
  const isLeft = commit.hash === leftHash
  const isRight = commit.hash === rightHash

  return (
    <div className={styles.row}>
      <div className={styles.meta}>
        <span className={styles.hash} title={commit.hash}>
          {commit.shortHash}
        </span>
        <span className={styles.subject} title={commit.subject}>
          {commit.subject}
        </span>
        <span className={styles.date}>{formatCommitDate(commit.date)}</span>
      </div>
      <span className={setupStyles.assign}>
        <IconButton
          variant="plain"
          size="sm"
          className={cx(setupStyles.side, isLeft && setupStyles.sideLeftActive)}
          onClick={() => onSelectLeft(commit)}
          aria-label={`${diffSideAriaLabel('left')}に指定`}
        >
          <DiffSideMark side="left" size="sm" />
        </IconButton>
        <IconButton
          variant="plain"
          size="sm"
          className={cx(setupStyles.side, isRight && setupStyles.sideRightActive)}
          onClick={() => onSelectRight(commit)}
          aria-label={`${diffSideAriaLabel('right')}に指定`}
        >
          <DiffSideMark side="right" size="sm" />
        </IconButton>
      </span>
    </div>
  )
}

export function GitDiffSetupPanel({
  activeDirectory,
  leftHash,
  rightHash,
  onSelectLeft,
  onSelectRight,
  onExitGitDiff,
}: GitDiffSetupPanelProps) {
  const {
    commits,
    loading,
    loadingMore,
    error,
    repo,
    hasMore,
    loadMore,
  } = useGitCommits(activeDirectory)

  const leftCommit = commits.find((commit) => commit.hash === leftHash)
  const rightCommit = commits.find((commit) => commit.hash === rightHash)

  return (
    <aside className={setupStyles.panel}>
      <div className={setupStyles.header}>
        <div className={setupStyles.titleRow}>
          <h2>Git 履歴比較</h2>
          <Button variant="plain" className={setupStyles.backBtn} onClick={onExitGitDiff}>
            <ArrowLeft size={14} aria-hidden="true" />
            編集に戻る
          </Button>
        </div>
        <div className={setupStyles.selection}>
          <p className={setupStyles.selRow}>
            <span className={setupStyles.tagLeft} aria-hidden="true">
              <DiffSideMark side="left" />
            </span>
            <span className={setupStyles.selValue} title={leftCommit?.hash}>
              {leftCommit
                ? `${leftCommit.shortHash} ${truncateMiddle(leftCommit.subject, 24)}`
                : '未選択'}
            </span>
          </p>
          <p className={setupStyles.selRow}>
            <span className={setupStyles.tagRight} aria-hidden="true">
              <DiffSideMark side="right" />
            </span>
            <span className={setupStyles.selValue} title={rightCommit?.hash}>
              {rightCommit
                ? `${rightCommit.shortHash} ${truncateMiddle(rightCommit.subject, 24)}`
                : '未選択'}
            </span>
          </p>
        </div>
        {repo.isRepo && repo.repoRoot && (
          <p className={styles.repoRoot} title={repo.repoRoot}>
            {truncateMiddle(repo.repoRoot, 42)}
          </p>
        )}
      </div>

      <div className={setupStyles.body}>
        {!activeDirectory && (
          <p className={setupStyles.empty}>
            参照ディレクトリが未設定です。先に「編集に戻る」からディレクトリを追加してください。
          </p>
        )}
        {activeDirectory && loading && (
          <p className={setupStyles.empty}>コミット一覧を読込中...</p>
        )}
        {activeDirectory && !loading && !repo.isRepo && (
          <p className={setupStyles.empty}>
            このディレクトリは Git リポジトリではありません。
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}
        {activeDirectory && !loading && repo.isRepo && commits.length === 0 && !error && (
          <p className={setupStyles.empty}>コミットがありません。</p>
        )}
        {activeDirectory && !loading && repo.isRepo && commits.length > 0 && (
          <div className={styles.list}>
            {commits.map((commit) => (
              <CommitRow
                key={commit.hash}
                commit={commit}
                leftHash={leftHash}
                rightHash={rightHash}
                onSelectLeft={onSelectLeft}
                onSelectRight={onSelectRight}
              />
            ))}
            {hasMore && (
              <div className={styles.moreRow}>
                <Button
                  variant="ghost"
                  className={styles.moreBtn}
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore ? '読込中...' : 'さらに読み込む'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
