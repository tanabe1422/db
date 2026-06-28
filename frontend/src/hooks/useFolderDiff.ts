import { useCallback, useEffect, useRef, useState } from 'react'

import type { TableDefinition, TreeNode } from '../types'
import { readTableFile } from '../lib/wails'
import { type TableDiff, diffTable } from '../lib/diffTable'
import { compareRelPaths } from '../lib/relPathSort'
import { collectFiles } from '../utils/treeFiles'

export type FileDiffStatus = 'changed' | 'same' | 'added' | 'removed' | 'error'

export interface FileDiffEntry {
  relPath: string
  status: FileDiffStatus
  leftPath?: string
  rightPath?: string
  left: TableDefinition | null
  right: TableDefinition | null
  diff: TableDiff | null
  error?: string
}

export interface FolderDiffCounts {
  changed: number
  added: number
  removed: number
  same: number
  error: number
}

interface ParsedFile {
  def: TableDefinition | null
  error?: string
}

async function loadDefinition(path: string): Promise<ParsedFile> {
  try {
    const raw = await readTableFile(path)
    try {
      return { def: JSON.parse(raw) as TableDefinition }
    } catch {
      return { def: null, error: 'JSON の解析に失敗しました' }
    }
  } catch (err) {
    return {
      def: null,
      error: err instanceof Error ? err.message : 'ファイルの読込に失敗しました',
    }
  }
}

async function buildEntry(
  relPath: string,
  leftPath: string | undefined,
  rightPath: string | undefined,
): Promise<FileDiffEntry> {
  if (leftPath && rightPath) {
    const [left, right] = await Promise.all([
      loadDefinition(leftPath),
      loadDefinition(rightPath),
    ])
    if (left.error || right.error) {
      return {
        relPath,
        status: 'error',
        leftPath,
        rightPath,
        left: left.def,
        right: right.def,
        diff: null,
        error: left.error ?? right.error,
      }
    }
    const diff = diffTable(left.def, right.def)
    return {
      relPath,
      status: diff.hasChanges ? 'changed' : 'same',
      leftPath,
      rightPath,
      left: left.def,
      right: right.def,
      diff,
    }
  }

  if (leftPath) {
    const left = await loadDefinition(leftPath)
    return {
      relPath,
      status: left.error ? 'error' : 'removed',
      leftPath,
      left: left.def,
      right: null,
      diff: left.error ? null : diffTable(left.def, null),
      error: left.error,
    }
  }

  const right = await loadDefinition(rightPath as string)
  return {
    relPath,
    status: right.error ? 'error' : 'added',
    rightPath,
    left: null,
    right: right.def,
    diff: right.error ? null : diffTable(null, right.def),
    error: right.error,
  }
}

export function countEntries(entries: FileDiffEntry[]): FolderDiffCounts {
  const counts: FolderDiffCounts = {
    changed: 0,
    added: 0,
    removed: 0,
    same: 0,
    error: 0,
  }
  for (const entry of entries) {
    counts[entry.status] += 1
  }
  return counts
}

export function useFolderDiff(left: TreeNode | null, right: TreeNode | null) {
  const [entries, setEntries] = useState<FileDiffEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 最新の実行だけを反映するためのトークン（フォルダ高速切替時の競合防止）。
  const runTokenRef = useRef(0)

  const leftKey = left?.path ?? ''
  const rightKey = right?.path ?? ''

  const run = useCallback(async () => {
    const token = (runTokenRef.current += 1)
    const isStale = () => token !== runTokenRef.current

    if (!left || !right) {
      setEntries([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const leftFiles = new Map(
      collectFiles(left).map((file) => [file.relPath, file.fullPath]),
    )
    const rightFiles = new Map(
      collectFiles(right).map((file) => [file.relPath, file.fullPath]),
    )
    const relPaths = Array.from(
      new Set([...leftFiles.keys(), ...rightFiles.keys()]),
    ).sort(compareRelPaths)

    try {
      const result = await Promise.all(
        relPaths.map((relPath) =>
          buildEntry(relPath, leftFiles.get(relPath), rightFiles.get(relPath)),
        ),
      )
      if (isStale()) {
        return
      }
      setEntries(result)
    } catch (err) {
      if (isStale()) {
        return
      }
      setError(err instanceof Error ? err.message : '比較に失敗しました')
      setEntries([])
    } finally {
      if (!isStale()) {
        setLoading(false)
      }
    }
    // leftKey/rightKey を依存に使うことでフォルダ変更時に再実行する。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftKey, rightKey])

  useEffect(() => {
    void run()
  }, [run])

  return { entries, loading, error, reload: run }
}
