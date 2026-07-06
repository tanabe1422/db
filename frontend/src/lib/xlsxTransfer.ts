import type { TreeNode } from '../types'
import { collectFiles, type LeafFile } from '../utils/treeFiles'
import { relPathWithinRoot } from '../utils/relPathWithinRoot'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import {
  type BatchProgressHandler,
  reportBatchProgress,
} from './batchProgress'
import {
  importXlsxDirectory,
  pickDirectory,
  prepareExportDirectory,
  writeXlsxExport,
  type XlsxImportResult,
} from './wails'

const TABLE_JSON_SUFFIX = '.table.json'
const XLSX_SUFFIX = '.xlsx'

function isTableJson(path: string): boolean {
  return path.endsWith(TABLE_JSON_SUFFIX)
}

function defaultXlsxPath(tableJsonRelPath: string): string {
  return `${tableJsonRelPath.slice(0, -TABLE_JSON_SUFFIX.length)}${XLSX_SUFFIX}`
}

function collectTableJsonFiles(
  activeDirectory: string,
  node: TreeNode,
): LeafFile[] {
  if (!node.isDir) {
    if (!isTableJson(node.path)) {
      return []
    }
    return [
      {
        relPath: relPathWithinRoot(activeDirectory, node.path),
        fullPath: node.path,
      },
    ]
  }

  const baseRel = relPathWithinRoot(activeDirectory, node.path)
  return collectFiles(node)
    .filter((file) => isTableJson(file.fullPath))
    .map((file) => ({
      relPath: baseRel ? `${baseRel}/${file.relPath}` : file.relPath,
      fullPath: file.fullPath,
    }))
}

/**
 * Exports *.table.json as xlsx under {activeDirectory}/export/YYYYMMDDHHmm/.
 */
export async function exportXlsxFiles(
  activeDirectory: string,
  node: TreeNode,
  onProgress?: BatchProgressHandler,
): Promise<string> {
  const exportRoot = await prepareExportDirectory(activeDirectory)
  const files = collectTableJsonFiles(activeDirectory, node)

  if (files.length === 0) {
    throw new Error('*.table.json ファイルが見つかりません')
  }

  const total = files.length
  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    reportBatchProgress(onProgress, {
      current: index,
      total,
      label: file.relPath,
    })
    await writeXlsxExport(
      exportRoot,
      file.fullPath,
      defaultXlsxPath(file.relPath),
    )
    reportBatchProgress(onProgress, {
      current: index + 1,
      total,
      label: file.relPath,
    })
  }

  return exportRoot
}

const GEN_PROGRESS_EVENT = 'gen:progress'

interface GenProgressPayload {
  current: number
  total: number
  label?: string
}

/**
 * Picks a source directory and imports all xlsx files into targetDir.
 */
export async function importXlsxToFolder(
  targetDir: string,
  onProgress?: BatchProgressHandler,
): Promise<XlsxImportResult> {
  const sourceDir = await pickDirectory()
  if (!sourceDir) {
    return { imported: 0, failures: [] }
  }

  const unsubscribe = onProgress
    ? EventsOn(GEN_PROGRESS_EVENT, (payload: GenProgressPayload) => {
        reportBatchProgress(onProgress, {
          current: payload.current,
          total: payload.total,
          label: payload.label,
        })
      })
    : undefined

  try {
    return await importXlsxDirectory(sourceDir, targetDir)
  } finally {
    unsubscribe?.()
  }
}
