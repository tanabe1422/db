import { useState, type ReactNode } from 'react'

import type { FileDiffEntry } from '../../lib/fileDiffEntry'
import { WorkspacePlaceholder } from '../workspace/WorkspacePlaceholder'

import { FileDiffView } from './FileDiffView'
import { FolderDiffView } from './FolderDiffView'

interface DiffWorkspaceShellProps {
  ready: boolean
  placeholder: {
    title: string
    message: ReactNode
  }
  leftLabel: string
  rightLabel: string
  entries: FileDiffEntry[]
  loading: boolean
  error: string | null
  onReload: () => void
  initialOpenRelPath?: string | null
  migrateScriptExport?: {
    onClick: () => void
    disabled?: boolean
  }
}

export function DiffWorkspaceShell({
  ready,
  placeholder,
  leftLabel,
  rightLabel,
  entries,
  loading,
  error,
  onReload,
  initialOpenRelPath = null,
  migrateScriptExport,
}: DiffWorkspaceShellProps) {
  const [openRelPath, setOpenRelPath] = useState<string | null>(initialOpenRelPath)

  if (!ready) {
    return (
      <WorkspacePlaceholder
        title={placeholder.title}
        message={placeholder.message}
      />
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
        loading={loading}
        onBack={() => setOpenRelPath(null)}
        onReload={onReload}
      />
    )
  }

  return (
    <FolderDiffView
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      entries={entries}
      loading={loading}
      error={error}
      onOpenFile={(entry) => setOpenRelPath(entry.relPath)}
      onReload={onReload}
      migrateScriptExport={migrateScriptExport}
    />
  )
}
