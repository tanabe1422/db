import { useFolderDiff } from '../../hooks/useFolderDiff'
import type { TreeNode } from '../../types'
import { relPathWithinRoot } from '../../utils/relPathWithinRoot'

import { DiffWorkspaceShell } from './DiffWorkspaceShell'

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
  const { entries, loading, error, reload } = useFolderDiff(leftNode, rightNode)

  return (
    <DiffWorkspaceShell
      ready={Boolean(leftNode && rightNode)}
      placeholder={{
        title: 'フォルダを2つ選択',
        message:
          'サイドバーで、シェブロン（‹ ›）のボタンから比較する2つのフォルダを選んでください。',
      }}
      leftLabel={diffLabel(leftNode, activeDirectory)}
      rightLabel={diffLabel(rightNode, activeDirectory)}
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
