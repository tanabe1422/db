import { useCallback, useEffect, useState } from 'react'

import type { FileDiffEntry } from '../../lib/fileDiffEntry'
import { buildFileDiffEntry } from '../../lib/fileDiffEntry'
import { readTableFile } from '../../lib/wails'
import type { DiffTabSource } from '../../types/workspaceTab'
import { FileDiffView } from '../diff/FileDiffView'
import { WorkspacePlaceholder } from './WorkspacePlaceholder'

interface DiffTabPanelProps {
  label: string
  source: DiffTabSource
  isActive?: boolean
}

export function DiffTabPanel({ label, source, isActive = true }: DiffTabPanelProps) {
  const [entry, setEntry] = useState<FileDiffEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isActive) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (source.type === 'files') {
        const [leftRaw, rightRaw] = await Promise.all([
          readTableFile(source.leftPath),
          readTableFile(source.rightPath),
        ])
        const next = await buildFileDiffEntry(
          label,
          leftRaw,
          rightRaw,
          source.leftPath,
          source.rightPath,
        )
        setEntry(next)
        if (next.error) {
          setError(next.error)
        }
        return
      }

      const next = await buildFileDiffEntry(label, source.leftJson, source.rightJson)
      setEntry(next)
      if (next.error) {
        setError(next.error)
      }
    } catch (err) {
      setEntry(null)
      setError(err instanceof Error ? err.message : 'diff の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [isActive, label, source])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !entry) {
    return <WorkspacePlaceholder message="diff を読み込み中..." />
  }

  if (error || !entry?.diff) {
    return (
      <WorkspacePlaceholder
        title="diff の読み込みエラー"
        message={error ?? entry?.error ?? 'diff を表示できません'}
      />
    )
  }

  return (
    <FileDiffView
      relPath={label}
      diff={entry.diff}
      loading={loading}
      variant="embedded"
      onBack={() => undefined}
      onReload={source.type === 'files' ? () => void load() : undefined}
    />
  )
}
