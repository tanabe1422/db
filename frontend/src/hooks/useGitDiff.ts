import { useCallback, useEffect, useRef, useState } from 'react'

import type { GitCommit } from '../types'
import {
  listGitCommits,
  listGitTableFiles,
  readGitTableFile,
  resolveGitRepo,
} from '../lib/wails'
import { compareRelPaths } from '../lib/relPathSort'
import {
  type FileDiffEntry,
  buildFileDiffEntry,
} from '../lib/fileDiffEntry'

export type { FileDiffEntry, FileDiffStatus, FolderDiffCounts } from '../lib/fileDiffEntry'
export { countEntries } from '../lib/fileDiffEntry'

const PAGE_SIZE = 50

interface GitRepoState {
  isRepo: boolean
  repoRoot: string
}

export function useGitCommits(activeDirectory: string) {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repo, setRepo] = useState<GitRepoState>({ isRepo: false, repoRoot: '' })
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (!activeDirectory) {
        setCommits([])
        setRepo({ isRepo: false, repoRoot: '' })
        setError(null)
        setHasMore(false)
        return
      }

      if (reset) {
        setLoading(true)
        offsetRef.current = 0
      } else {
        setLoadingMore(true)
      }
      setError(null)

      try {
        const info = await resolveGitRepo(activeDirectory)
        setRepo({ isRepo: info.isRepo, repoRoot: info.repoRoot })
        if (!info.isRepo) {
          setCommits([])
          setHasMore(false)
          return
        }

        const page = await listGitCommits(
          activeDirectory,
          PAGE_SIZE,
          offsetRef.current,
        )
        offsetRef.current += page.length
        setHasMore(page.length === PAGE_SIZE)
        setCommits((prev) => (reset ? page : [...prev, ...page]))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'コミット一覧の取得に失敗しました')
        if (reset) {
          setCommits([])
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [activeDirectory],
  )

  useEffect(() => {
    void loadPage(true)
  }, [loadPage])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return
    }
    void loadPage(false)
  }, [hasMore, loadPage, loading, loadingMore])

  return {
    commits,
    loading,
    loadingMore,
    error,
    repo,
    hasMore,
    loadMore,
    reload: () => loadPage(true),
  }
}

async function loadGitFile(
  activeDirectory: string,
  commitHash: string,
  relPath: string,
): Promise<string | null> {
  try {
    return await readGitTableFile(activeDirectory, commitHash, relPath)
  } catch {
    return null
  }
}

export function useGitDiff(
  activeDirectory: string,
  leftHash: string | null,
  rightHash: string | null,
) {
  const [entries, setEntries] = useState<FileDiffEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const runTokenRef = useRef(0)

  const run = useCallback(async () => {
    const token = (runTokenRef.current += 1)
    const isStale = () => token !== runTokenRef.current

    if (!activeDirectory || !leftHash || !rightHash) {
      setEntries([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [leftFiles, rightFiles] = await Promise.all([
        listGitTableFiles(activeDirectory, leftHash),
        listGitTableFiles(activeDirectory, rightHash),
      ])
      const relPaths = Array.from(
        new Set([...leftFiles, ...rightFiles]),
      ).sort(compareRelPaths)

      const leftSet = new Set(leftFiles)
      const rightSet = new Set(rightFiles)

      const result = await Promise.all(
        relPaths.map(async (relPath) => {
          const [leftRaw, rightRaw] = await Promise.all([
            leftSet.has(relPath)
              ? loadGitFile(activeDirectory, leftHash, relPath)
              : Promise.resolve(null),
            rightSet.has(relPath)
              ? loadGitFile(activeDirectory, rightHash, relPath)
              : Promise.resolve(null),
          ])

          if (leftRaw === null && leftSet.has(relPath)) {
            return {
              relPath,
              status: 'error' as const,
              leftPath: leftHash,
              rightPath: rightHash,
              left: null,
              right: null,
              diff: null,
              error: '左側のファイル読込に失敗しました',
            }
          }
          if (rightRaw === null && rightSet.has(relPath)) {
            return {
              relPath,
              status: 'error' as const,
              leftPath: leftHash,
              rightPath: rightHash,
              left: null,
              right: null,
              diff: null,
              error: '右側のファイル読込に失敗しました',
            }
          }

          return buildFileDiffEntry(
            relPath,
            leftRaw,
            rightRaw,
            leftHash,
            rightHash,
          )
        }),
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
  }, [activeDirectory, leftHash, rightHash])

  useEffect(() => {
    void run()
  }, [run])

  return { entries, loading, error, reload: run }
}
