import type { TreeNode } from '../types'
import { collectFiles, type LeafFile } from '../utils/treeFiles'
import { relPathWithinRoot } from '../utils/relPathWithinRoot'
import { compareRelPaths } from './relPathSort'
import {
  ensureExportRelDir,
  generateCreateScript,
  generateMigrateScript,
  prepareExportDirectory,
  writeExportFile,
} from './wails'

const TABLE_JSON_SUFFIX = '.table.json'

function isTableJson(path: string): boolean {
  return path.endsWith(TABLE_JSON_SUFFIX)
}

function defaultSqlPath(tableJsonRelPath: string): string {
  return `${tableJsonRelPath.slice(0, -TABLE_JSON_SUFFIX.length)}.sql`
}

function defaultMigrateSqlPath(tableJsonRelPath: string): string {
  return `${tableJsonRelPath.slice(0, -TABLE_JSON_SUFFIX.length)}.migrate.sql`
}

function collectScriptFiles(
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

async function writeScriptResult(
  exportRoot: string,
  result: { sql: string; relPath: string },
  fallbackRelPath: string,
): Promise<void> {
  if (!result.sql) {
    return
  }

  const outPath = result.relPath || fallbackRelPath
  await ensureExportRelDir(exportRoot, outPath)
  await writeExportFile(exportRoot, outPath, result.sql)
}

/**
 * Generates CREATE scripts for the selected file or folder under
 * {activeDirectory}/export/YYYYMMDDHHmm/.
 */
export async function exportCreateScripts(
  activeDirectory: string,
  node: TreeNode,
): Promise<string> {
  const exportRoot = await prepareExportDirectory(activeDirectory)
  const files = collectScriptFiles(activeDirectory, node)

  if (files.length === 0) {
    throw new Error('*.table.json ファイルが見つかりません')
  }

  for (const file of files) {
    const result = await generateCreateScript(file.fullPath)
    await writeScriptResult(
      exportRoot,
      result,
      defaultSqlPath(file.relPath),
    )
  }

  return exportRoot
}

/**
 * Generates migration scripts for table definitions that exist on both sides.
 */
export async function exportMigrateScripts(
  activeDirectory: string,
  leftNode: TreeNode,
  rightNode: TreeNode,
): Promise<string> {
  const exportRoot = await prepareExportDirectory(activeDirectory)

  const leftFiles = new Map(
    collectFiles(leftNode)
      .filter((file) => isTableJson(file.fullPath))
      .map((file) => [file.relPath, file.fullPath]),
  )
  const rightFiles = new Map(
    collectFiles(rightNode)
      .filter((file) => isTableJson(file.fullPath))
      .map((file) => [file.relPath, file.fullPath]),
  )

  const relPaths = Array.from(
    new Set([...leftFiles.keys(), ...rightFiles.keys()]),
  )
    .filter((relPath) => leftFiles.has(relPath) && rightFiles.has(relPath))
    .sort(compareRelPaths)

  if (relPaths.length === 0) {
    throw new Error('両側に共通する *.table.json がありません')
  }

  for (const relPath of relPaths) {
    const result = await generateMigrateScript(
      leftFiles.get(relPath)!,
      rightFiles.get(relPath)!,
    )
    await writeScriptResult(
      exportRoot,
      result,
      defaultMigrateSqlPath(relPath),
    )
  }

  return exportRoot
}
