import { useState } from 'react'

import { useFolderDiff, type FileDiffEntry } from '../../hooks/useFolderDiff'
import type { TreeNode } from '../../types'

import { FileDiffView } from './FileDiffView'
import { FolderDiffView } from './FolderDiffView'
import styles from '../../App.module.css'

function diffLabel(node: TreeNode | null): string {
  return node?.path || node?.name || ''
}

interface DiffWorkspaceProps {
  leftNode: TreeNode | null
  rightNode: TreeNode | null
}

export function DiffWorkspace({ leftNode, rightNode }: DiffWorkspaceProps) {
  const { entries, loading, error } = useFolderDiff(leftNode, rightNode)
  const [openRelPath, setOpenRelPath] = useState<string | null>(null)

  if (!leftNode || !rightNode) {
    return (
      <div className={styles.placeholder}>
        <h2>フォルダを2つ選択</h2>
        <p>左のパネルで、シェブロン（‹ ›）のボタンから比較する2つのフォルダを選んでください。</p>
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
      leftLabel={diffLabel(leftNode)}
      rightLabel={diffLabel(rightNode)}
      entries={entries}
      loading={loading}
      error={error}
      onOpenFile={(entry) => setOpenRelPath(entry.relPath)}
    />
  )
}
