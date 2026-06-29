import type { TreeNode } from '../types'
import { collectFiles, type LeafFile } from '../utils/treeFiles'
import { relPathWithinRoot } from '../utils/relPathWithinRoot'
import {
  ensureExportRelDir,
  generateXlsxExport,
  importXlsxDirectory,
  pickDirectory,
  prepareExportDirectory,
  writeExportBinaryFile,
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

async function writeXlsxResult(
  exportRoot: string,
  result: { data: number[]; relPath: string },
  fallbackRelPath: string,
): Promise<void> {
  if (!result.data || result.data.length === 0) {
    return
  }

  const outPath = result.relPath || fallbackRelPath
  await ensureExportRelDir(exportRoot, outPath)
  await writeExportBinaryFile(exportRoot, outPath, result.data)
}

/**
 * Exports *.table.json as xlsx under {activeDirectory}/export/YYYYMMDDHHmm/.
 */
export async function exportXlsxFiles(
  activeDirectory: string,
  node: TreeNode,
): Promise<string> {
  const exportRoot = await prepareExportDirectory(activeDirectory)
  const files = collectTableJsonFiles(activeDirectory, node)

  if (files.length === 0) {
    throw new Error('*.table.json ファイルが見つかりません')
  }

  for (const file of files) {
    const result = await generateXlsxExport(file.fullPath)
    await writeXlsxResult(exportRoot, result, defaultXlsxPath(file.relPath))
  }

  return exportRoot
}

/**
 * Picks a source directory and imports all xlsx files into targetDir.
 */
export async function importXlsxToFolder(
  targetDir: string,
): Promise<XlsxImportResult> {
  const sourceDir = await pickDirectory()
  if (!sourceDir) {
    return { imported: 0, failures: [] }
  }

  return importXlsxDirectory(sourceDir, targetDir)
}
