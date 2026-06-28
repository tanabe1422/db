import { useState } from 'react'

import {
  useGitDiff,
  type FileDiffEntry,
} from '../../hooks/useGitDiff'
import type { GitCommit } from '../../types'

import { FileDiffView } from './FileDiffView'
import { FolderDiffView } from './FolderDiffView'
import styles from '../../App.module.css'

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
}

export function GitDiffWorkspace({
  activeDirectory,
  leftCommit,
  rightCommit,
}: GitDiffWorkspaceProps) {
  const { entries, loading, error } = useGitDiff(
    activeDirectory,
    leftCommit?.hash ?? null,
    rightCommit?.hash ?? null,
  )
  const [openRelPath, setOpenRelPath] = useState<string | null>(null)

  if (!leftCommit || !rightCommit) {
    return (
      <div className={styles.placeholder}>
        <h2>コミットを2つ選択</h2>
        <p>
          左のパネルで、‹ › ボタンから比較する2つのコミットを選んでください。
          古い方を左、新しい方を右にすると見やすいです。
        </p>
      </div>
    )
  }

  const openEntry: FileDiffEntry | null =
    openRelPath != null
      ? entries.find((entry) => entry.relPath === openRelPath) ?? null
      : null

  if (openEntry && openEntry.diff) {
    return (
      <FileDiffView
        relPath={openEntry.relPath}
        diff={openEntry.diff}
        onBack={() => setOpenRelPath(null)}
      />
    )
  }

  return (
    <FolderDiffView
      leftLabel={commitLabel(leftCommit)}
      rightLabel={commitLabel(rightCommit)}
      entries={entries}
      loading={loading}
      error={error}
      onOpenFile={(entry) => setOpenRelPath(entry.relPath)}
    />
  )
}
