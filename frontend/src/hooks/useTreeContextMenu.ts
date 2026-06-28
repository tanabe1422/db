import { useCallback, useState, type MouseEvent } from 'react'

import type { ContextMenuItem } from '../components/ui/ContextMenu'
import { exportTreeSelection } from '../lib/export'
import { showInExplorer } from '../lib/wails'
import type { TreeNode } from '../types'

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
}

interface UseTreeContextMenuOptions {
  activeDirectory: string
  /** When false, the export menu item is omitted (e.g. diff folder tree). */
  enableExport?: boolean
}

export function useTreeContextMenu({
  activeDirectory,
  enableExport = true,
}: UseTreeContextMenuOptions) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const closeMenu = useCallback(() => setMenu(null), [])

  const openNodeMenu = useCallback(
    (node: TreeNode, event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!node.path) {
        return
      }

      const items: ContextMenuItem[] = []

      if (enableExport && activeDirectory) {
        items.push({
          label: 'エクスポート',
          onClick: () => {
            void exportTreeSelection(activeDirectory, node)
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
    [activeDirectory, enableExport],
  )

  return { menu, openNodeMenu, closeMenu }
}
