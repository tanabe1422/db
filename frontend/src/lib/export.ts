import type { TreeNode } from '../types'
import { collectFiles, type LeafFile } from '../utils/treeFiles'
import { relPathWithinRoot } from '../utils/relPathWithinRoot'
import { ensureExportRelDir, prepareExportDirectory } from './wails'

function collectExportFiles(
  activeDirectory: string,
  node: TreeNode,
): LeafFile[] {
  if (!node.isDir) {
    return [
      {
        relPath: relPathWithinRoot(activeDirectory, node.path),
        fullPath: node.path,
      },
    ]
  }

  const baseRel = relPathWithinRoot(activeDirectory, node.path)
  return collectFiles(node).map((file) => ({
    relPath: baseRel ? `${baseRel}/${file.relPath}` : file.relPath,
    fullPath: file.fullPath,
  }))
}

/**
 * Exports the selected file or folder subtree under
 * {activeDirectory}/export/YYYYMMDDHHmm/, preserving directory structure.
 */
export async function exportTreeSelection(
  activeDirectory: string,
  node: TreeNode,
): Promise<string> {
  const exportRoot = await prepareExportDirectory(activeDirectory)
  const files = collectExportFiles(activeDirectory, node)

  for (const file of files) {
    await ensureExportRelDir(exportRoot, file.relPath)
    // TODO: read file.fullPath, transform *.table.json → output format, write to exportRoot/file.relPath
    console.info('[export] TODO: write', file.fullPath, '→', exportRoot, file.relPath)
  }

  return exportRoot
}

/**
 * Exports the diff between two folder selections under
 * {activeDirectory}/export/YYYYMMDDHHmm/.
 */
export async function exportDiff(
  activeDirectory: string,
  leftNode: TreeNode,
  rightNode: TreeNode,
): Promise<string> {
  const exportRoot = await prepareExportDirectory(activeDirectory)

  // TODO: compare leftNode vs rightNode, emit diff artifacts under exportRoot
  console.info('[export] TODO: diff export', {
    exportRoot,
    left: leftNode.path,
    right: rightNode.path,
  })

  return exportRoot
}
