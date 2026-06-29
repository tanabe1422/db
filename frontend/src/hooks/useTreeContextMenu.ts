import { useCallback, useState, type MouseEvent } from 'react'

import type { ContextMenuItem } from '../components/ui/ContextMenu'
import { exportCreateScripts } from '../lib/scriptExport'
import { exportXlsxFiles, importXlsxToFolder } from '../lib/xlsxTransfer'
import { showInExplorer, type XlsxImportFailure } from '../lib/wails'
import type { TreeNode } from '../types'

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
}

interface UseTreeContextMenuOptions {
  activeDirectory: string
  /** When false, the create-script menu item is omitted (e.g. diff folder tree). */
  enableCreateScript?: boolean
  enableXlsxExport?: boolean
  enableXlsxImport?: boolean
  onRescan?: () => void | Promise<void>
}

function reportError(err: unknown, fallback: string): void {
  const message = err instanceof Error ? err.message : fallback
  window.alert(message)
}

export function useTreeContextMenu({
  activeDirectory,
  enableCreateScript = true,
  enableXlsxExport = true,
  enableXlsxImport = true,
  onRescan,
}: UseTreeContextMenuOptions) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [importFailures, setImportFailures] = useState<XlsxImportFailure[] | null>(
    null,
  )

  const closeMenu = useCallback(() => setMenu(null), [])
  const closeImportFailures = useCallback(() => setImportFailures(null), [])

  const openNodeMenu = useCallback(
    (node: TreeNode, event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!node.path) {
        return
      }

      const items: ContextMenuItem[] = []

      if (enableCreateScript && activeDirectory) {
        items.push({
          label: '作成スクリプト生成',
          onClick: () => {
            void exportCreateScripts(activeDirectory, node).catch((err: unknown) => {
              reportError(err, '作成スクリプトの生成に失敗しました')
            })
          },
        })
      }

      if (enableXlsxExport && activeDirectory) {
        items.push({
          label: '定義書エクスポート',
          onClick: () => {
            void exportXlsxFiles(activeDirectory, node).catch((err: unknown) => {
              reportError(err, '定義書のエクスポートに失敗しました')
            })
          },
        })
      }

      if (enableXlsxImport && activeDirectory && node.isDir) {
        items.push({
          label: '定義書インポート',
          onClick: () => {
            void importXlsxToFolder(node.path)
              .then(async (result) => {
                if (result.imported > 0) {
                  await onRescan?.()
                }
                if (result.failures.length > 0) {
                  setImportFailures(result.failures)
                }
              })
              .catch((err: unknown) => {
                reportError(err, '定義書のインポートに失敗しました')
              })
          },
        })
      }

      items.push({
        label: 'エクスプローラーで表示',
        onClick: () => {
          void showInExplorer(node.path)
        },
      })

      setMenu({ x: event.clientX, y: event.clientY, items })
    },
    [
      activeDirectory,
      enableCreateScript,
      enableXlsxExport,
      enableXlsxImport,
      onRescan,
    ],
  )

  return {
    menu,
    importFailures,
    closeImportFailures,
    openNodeMenu,
    closeMenu,
  }
}
