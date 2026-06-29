import type { TableDefinition, TreeNode } from '../types'
import { collectFiles, type LeafFile } from '../utils/treeFiles'
import { relPathWithinRoot } from '../utils/relPathWithinRoot'
import { diffTable } from './diffTable'
import { compareRelPaths } from './relPathSort'
import {
  ensureExportRelDir,
  generateCreateScript,
  generateCreateScriptFromJSON,
  generateMigrateScriptFromJSON,
  listGitTableFiles,
  prepareExportDirectory,
  readGitTableFile,
  readTableFile,
  writeExportFile,
} from './wails'

const TABLE_JSON_SUFFIX = '.table.json'

interface MigrateScriptPair {
  relPath: string
  beforeJSON: string
  afterJSON: string
}

interface AddedScriptFile {
  relPath: string
  afterJSON: string
}

interface DiffExportSnapshot {
  pairs: MigrateScriptPair[]
  added: AddedScriptFile[]
}

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

function migratePairHasChanges(pair: MigrateScriptPair): boolean {
  try {
    const left = JSON.parse(pair.beforeJSON) as TableDefinition
    const right = JSON.parse(pair.afterJSON) as TableDefinition
    return diffTable(left, right).hasChanges
  } catch {
    return false
  }
}

async function exportDiffScripts(
  activeDirectory: string,
  snapshot: DiffExportSnapshot,
): Promise<string> {
  const changedPairs = snapshot.pairs.filter(migratePairHasChanges)
  const addedFiles = snapshot.added

  if (changedPairs.length === 0 && addedFiles.length === 0) {
    throw new Error('変更・追加のある *.table.json がありません')
  }

  const exportRoot = await prepareExportDirectory(activeDirectory)

  for (const pair of changedPairs) {
    const result = await generateMigrateScriptFromJSON(
      pair.beforeJSON,
      pair.afterJSON,
      { beforeLabel: pair.relPath, afterLabel: pair.relPath },
    )
    await writeScriptResult(
      exportRoot,
      result,
      defaultMigrateSqlPath(pair.relPath),
    )
  }

  for (const file of addedFiles) {
    const result = await generateCreateScriptFromJSON(file.afterJSON, {
      label: file.relPath,
    })
    await writeScriptResult(exportRoot, result, defaultSqlPath(file.relPath))
  }

  return exportRoot
}

function buildDiffExportSnapshot(
  relPaths: string[],
  leftFiles: Map<string, string>,
  rightFiles: Map<string, string>,
  readLeft: (relPath: string) => Promise<string>,
  readRight: (relPath: string) => Promise<string>,
): Promise<DiffExportSnapshot> {
  const pairs: MigrateScriptPair[] = []
  const added: AddedScriptFile[] = []

  return (async () => {
    for (const relPath of relPaths) {
      const onLeft = leftFiles.has(relPath)
      const onRight = rightFiles.has(relPath)

      if (onLeft && onRight) {
        pairs.push({
          relPath,
          beforeJSON: await readLeft(relPath),
          afterJSON: await readRight(relPath),
        })
      } else if (onRight) {
        added.push({
          relPath,
          afterJSON: await readRight(relPath),
        })
      }
    }

    return { pairs, added }
  })()
}

async function collectFolderDiffExport(
  leftNode: TreeNode,
  rightNode: TreeNode,
): Promise<DiffExportSnapshot> {
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
  ).sort(compareRelPaths)

  return buildDiffExportSnapshot(
    relPaths,
    leftFiles,
    rightFiles,
    async (relPath) => readTableFile(leftFiles.get(relPath)!),
    async (relPath) => readTableFile(rightFiles.get(relPath)!),
  )
}

async function collectGitDiffExport(
  activeDirectory: string,
  leftHash: string,
  rightHash: string,
): Promise<DiffExportSnapshot> {
  const [leftFiles, rightFiles] = await Promise.all([
    listGitTableFiles(activeDirectory, leftHash),
    listGitTableFiles(activeDirectory, rightHash),
  ])
  const leftMap = new Map(leftFiles.map((relPath) => [relPath, relPath]))
  const rightMap = new Map(rightFiles.map((relPath) => [relPath, relPath]))

  const relPaths = Array.from(
    new Set([...leftFiles, ...rightFiles]),
  ).sort(compareRelPaths)

  return buildDiffExportSnapshot(
    relPaths,
    leftMap,
    rightMap,
    async (relPath) => readGitTableFile(activeDirectory, leftHash, relPath),
    async (relPath) => readGitTableFile(activeDirectory, rightHash, relPath),
  )
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
 * Generates migration scripts for changed tables and CREATE scripts for added tables.
 */
export async function exportMigrateScripts(
  activeDirectory: string,
  leftNode: TreeNode,
  rightNode: TreeNode,
): Promise<string> {
  const snapshot = await collectFolderDiffExport(leftNode, rightNode)
  return exportDiffScripts(activeDirectory, snapshot)
}

/**
 * Same as exportMigrateScripts, but reads table definitions from two Git commits.
 */
export async function exportGitMigrateScripts(
  activeDirectory: string,
  leftHash: string,
  rightHash: string,
): Promise<string> {
  const snapshot = await collectGitDiffExport(activeDirectory, leftHash, rightHash)
  return exportDiffScripts(activeDirectory, snapshot)
}
