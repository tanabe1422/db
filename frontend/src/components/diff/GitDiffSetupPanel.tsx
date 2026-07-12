import type { GitCommit } from '../../types'
import { useGitCommits } from '../../hooks/useGitDiff'
import { truncateMiddle } from '../../utils/truncateMiddle'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

import { DiffSideAssignButtons } from './DiffSideAssignButtons'
import { DiffSideMark } from './DiffSideMark'
import setupStyles from './DiffSetupPanel.module.css'
import styles from './GitDiffSetupPanel.module.css'

interface GitDiffSetupPanelProps {
  activeDirectory: string
  leftHash?: string
  rightHash?: string
  onSelectLeft: (commit: GitCommit) => void
  onSelectRight: (commit: GitCommit) => void
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
        <Tooltip content={commit.hash} wrap>
          <span className={styles.hash}>{commit.shortHash}</span>
        </Tooltip>
        <Tooltip content={commit.subject} wrap>
          <span className={styles.subject}>{commit.subject}</span>
        </Tooltip>
        <span className={styles.date}>{formatCommitDate(commit.date)}</span>
      </div>
      <DiffSideAssignButtons
        isLeft={isLeft}
        isRight={isRight}
        onSelectLeft={() => onSelectLeft(commit)}
        onSelectRight={() => onSelectRight(commit)}
      />
    </div>
  )
}

export function GitDiffSetupPanel({
  activeDirectory,
  leftHash,
  rightHash,
  onSelectLeft,
  onSelectRight,
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
    <div className={setupStyles.root}>
      <div className={setupStyles.subHeader}>
        <div className={setupStyles.selection}>
          <p className={setupStyles.selRow}>
            <span className={setupStyles.tagLeft} aria-hidden="true">
              <DiffSideMark side="left" />
            </span>
            <Tooltip content={leftCommit?.hash ?? ''} wrap>
              <span className={setupStyles.selValue}>
                {leftCommit
                  ? `${leftCommit.shortHash} ${truncateMiddle(leftCommit.subject, 24)}`
                  : '未選択'}
              </span>
            </Tooltip>
          </p>
          <p className={setupStyles.selRow}>
            <span className={setupStyles.tagRight} aria-hidden="true">
              <DiffSideMark side="right" />
            </span>
            <Tooltip content={rightCommit?.hash ?? ''} wrap>
              <span className={setupStyles.selValue}>
                {rightCommit
                  ? `${rightCommit.shortHash} ${truncateMiddle(rightCommit.subject, 24)}`
                  : '未選択'}
              </span>
            </Tooltip>
          </p>
        </div>
        {repo.isRepo && repo.repoRoot && (
          <Tooltip content={repo.repoRoot} wrap>
            <p className={styles.repoRoot}>{truncateMiddle(repo.repoRoot, 42)}</p>
          </Tooltip>
        )}
      </div>

      <div className={setupStyles.scroll}>
        {!activeDirectory && (
          <p className={setupStyles.empty}>
            参照ディレクトリが未設定です。上部のフォルダボタンから追加してください。
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
          <p className={setupStyles.empty}>
            *.table.json の変更があるコミットがありません。
          </p>
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
    </div>
  )
}
