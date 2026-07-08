import { useCallback, useEffect, useState } from 'react'

import type { FileDiffEntry } from '../../lib/fileDiffEntry'
import { buildFileDiffEntry } from '../../lib/fileDiffEntry'
import { readTableFile } from '../../lib/wails'
import type { DiffTabSource } from '../../types/workspaceTab'
import { FileDiffView } from '../diff/FileDiffView'

import styles from '../../App.module.css'

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
    return (
      <div className={styles.placeholder}>
        <p>diff を読み込み中...</p>
      </div>
    )
  }

  if (error || !entry?.diff) {
    return (
      <div className={styles.placeholder}>
        <h2>diff の読み込みエラー</h2>
        <p>{error ?? entry?.error ?? 'diff を表示できません'}</p>
      </div>
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
