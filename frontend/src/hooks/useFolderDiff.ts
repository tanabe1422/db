import { useCallback, useEffect, useRef, useState } from 'react'

import type { TreeNode } from '../types'
import { errorMessage } from '../lib/errorMessage'
import { readTableFile } from '../lib/wails'
import { compareRelPaths } from '../lib/relPathSort'
import { collectFiles } from '../utils/treeFiles'
import {
  type FileDiffEntry,
  buildFileDiffEntry,
} from '../lib/fileDiffEntry'

const TABLE_JSON_SUFFIX = '.table.json'

function isTableJson(path: string): boolean {
  return path.endsWith(TABLE_JSON_SUFFIX)
}

export type { FileDiffEntry, FileDiffStatus, FolderDiffCounts } from '../lib/fileDiffEntry'
export { countEntries } from '../lib/fileDiffEntry'

async function loadDefinition(path: string): Promise<string | null> {
  try {
    return await readTableFile(path)
  } catch {
    return null
  }
}

async function buildEntry(
  relPath: string,
  leftPath: string | undefined,
  rightPath: string | undefined,
): Promise<FileDiffEntry> {
  if (leftPath && rightPath) {
    const [leftRaw, rightRaw] = await Promise.all([
      loadDefinition(leftPath),
      loadDefinition(rightPath),
    ])
    if (leftRaw === null) {
      return {
        relPath,
        status: 'error',
        leftPath,
        rightPath,
        left: null,
        right: null,
        diff: null,
        error: '左側のファイル読込に失敗しました',
      }
    }
    if (rightRaw === null) {
      return {
        relPath,
        status: 'error',
        leftPath,
        rightPath,
        left: null,
        right: null,
        diff: null,
        error: '右側のファイル読込に失敗しました',
      }
    }
    return buildFileDiffEntry(relPath, leftRaw, rightRaw, leftPath, rightPath)
  }

  if (leftPath) {
    const leftRaw = await loadDefinition(leftPath)
    if (leftRaw === null) {
      return {
        relPath,
        status: 'error',
        leftPath,
        left: null,
        right: null,
        diff: null,
        error: 'ファイルの読込に失敗しました',
      }
    }
    return buildFileDiffEntry(relPath, leftRaw, null, leftPath, undefined)
  }

  const rightRaw = await loadDefinition(rightPath as string)
  if (rightRaw === null) {
    return {
      relPath,
      status: 'error',
      rightPath,
      left: null,
      right: null,
      diff: null,
      error: 'ファイルの読込に失敗しました',
    }
  }
  return buildFileDiffEntry(relPath, null, rightRaw, undefined, rightPath)
}

export function useFolderDiff(left: TreeNode | null, right: TreeNode | null) {
  const [entries, setEntries] = useState<FileDiffEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTokenRef = useRef(0)

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
      collectFiles(left)
        .filter((file) => isTableJson(file.fullPath))
        .map((file) => [file.relPath, file.fullPath]),
    )
    const rightFiles = new Map(
      collectFiles(right)
        .filter((file) => isTableJson(file.fullPath))
        .map((file) => [file.relPath, file.fullPath]),
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
      setError(errorMessage(err, '比較に失敗しました'))
      setEntries([])
    } finally {
      if (!isStale()) {
        setLoading(false)
      }
    }
  }, [left, right])

  useEffect(() => {
    void run()
  }, [run])

  return { entries, loading, error, reload: run }
}
