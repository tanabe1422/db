import { useState } from 'react'

import { useFolderDiff, type FileDiffEntry } from '../../hooks/useFolderDiff'
import type { TreeNode } from '../../types'
import { relPathWithinRoot } from '../../utils/relPathWithinRoot'

import { FileDiffView } from './FileDiffView'
import { FolderDiffView } from './FolderDiffView'
import styles from '../../App.module.css'

function diffLabel(node: TreeNode | null, activeDirectory: string): string {
  if (!node) {
    return ''
  }
  return relPathWithinRoot(activeDirectory, node.path) || node.name
}

interface DiffWorkspaceProps {
  activeDirectory: string
  leftNode: TreeNode | null
  rightNode: TreeNode | null
  migrateScriptExport?: {
    onClick: () => void
    disabled?: boolean
  }
}

export function DiffWorkspace({
  activeDirectory,
  leftNode,
  rightNode,
  migrateScriptExport,
}: DiffWorkspaceProps) {
  const { entries, loading, error } = useFolderDiff(leftNode, rightNode)
  const [openRelPath, setOpenRelPath] = useState<string | null>(null)

  if (!leftNode || !rightNode) {
    return (
      <div className={styles.placeholder}>
        <h2>フォルダを2つ選択</h2>
        <p>サイドバーで、シェブロン（‹ ›）のボタンから比較する2つのフォルダを選んでください。</p>
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
      leftLabel={diffLabel(leftNode, activeDirectory)}
      rightLabel={diffLabel(rightNode, activeDirectory)}
      entries={entries}
      loading={loading}
      error={error}
      onOpenFile={(entry) => setOpenRelPath(entry.relPath)}
      migrateScriptExport={migrateScriptExport}
    />
  )
}
