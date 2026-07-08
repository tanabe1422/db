import type { TableDefinition } from '../types'
import { normalizeTableDefinition } from '../utils/serializeTable'
import { type TableDiff, diffTable } from './diffTable'

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

function parseDefinition(raw: string): ParsedFile {
  try {
    const parsed = normalizeTableDefinition(JSON.parse(raw))
    return { def: parsed as TableDefinition }
  } catch {
    return { def: null, error: 'JSON の解析に失敗しました' }
  }
}

export async function buildFileDiffEntry(
  relPath: string,
  leftRaw: string | null | undefined,
  rightRaw: string | null | undefined,
  leftLabel?: string,
  rightLabel?: string,
): Promise<FileDiffEntry> {
  if (leftRaw != null && rightRaw != null) {
    const left = parseDefinition(leftRaw)
    const right = parseDefinition(rightRaw)
    if (left.error || right.error) {
      return {
        relPath,
        status: 'error',
        leftPath: leftLabel,
        rightPath: rightLabel,
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
      leftPath: leftLabel,
      rightPath: rightLabel,
      left: left.def,
      right: right.def,
      diff,
    }
  }

  if (leftRaw != null) {
    const left = parseDefinition(leftRaw)
    return {
      relPath,
      status: left.error ? 'error' : 'removed',
      leftPath: leftLabel,
      left: left.def,
      right: null,
      diff: left.error ? null : diffTable(left.def, null),
      error: left.error,
    }
  }

  const right = parseDefinition(rightRaw as string)
  return {
    relPath,
    status: right.error ? 'error' : 'added',
    rightPath: rightLabel,
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
