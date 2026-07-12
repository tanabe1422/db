import { useGitDiff } from '../../hooks/useGitDiff'
import type { GitCommit } from '../../types'

import { DiffWorkspaceShell } from './DiffWorkspaceShell'

function commitLabel(commit: GitCommit | null): string {
  if (!commit) {
    return ''
  }
  return `${commit.shortHash} ${commit.subject}`
}

interface GitDiffWorkspaceProps {
  activeDirectory: string
  leftCommit: GitCommit | null
  rightCommit: GitCommit | null
  migrateScriptExport?: {
    onClick: () => void
    disabled?: boolean
  }
}

export function GitDiffWorkspace({
  activeDirectory,
  leftCommit,
  rightCommit,
  migrateScriptExport,
}: GitDiffWorkspaceProps) {
  const { entries, loading, error, reload } = useGitDiff(
    activeDirectory,
    leftCommit?.hash ?? null,
    rightCommit?.hash ?? null,
  )

  return (
    <DiffWorkspaceShell
      ready={Boolean(leftCommit && rightCommit)}
      placeholder={{
        title: 'コミットを2つ選択',
        message: (
          <>
            サイドバーで、‹ › ボタンから比較する2つのコミットを選んでください。
            古い方を左、新しい方を右にすると見やすいです。
          </>
        ),
      }}
      leftLabel={commitLabel(leftCommit)}
      rightLabel={commitLabel(rightCommit)}
      entries={entries}
      loading={loading}
      error={error}
      onReload={() => {
        void reload()
      }}
      migrateScriptExport={migrateScriptExport}
    />
  )
}
