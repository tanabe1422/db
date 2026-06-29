import { FolderCog, GitBranch, GitCompare, RefreshCw } from 'lucide-react'

import type { TreeNode as TreeNodeType } from '../../types'
import { useTreeContextMenu } from '../../hooks/useTreeContextMenu'
import { truncateMiddle } from '../../utils/truncateMiddle'
import { SidebarIconBar } from '../layout/SidebarIconBar'
import { AlertDialog } from '../ui/AlertDialog'
import { ContextMenu } from '../ui/ContextMenu'
import { IconButton } from '../ui/Button'

import styles from './DirectoryPanel.module.css'
import { TreeNode } from './TreeNode'

interface DirectoryPanelProps {
  activeDirectory: string
  tree: TreeNodeType | null
  loading: boolean
  error: string | null
  selectedPath?: string
  onSelectFile?: (path: string) => void
  onManageDirectories?: () => void
  onRescan?: () => void
  onEnterDiffMode?: () => void
  onEnterGitDiffMode?: () => void
}

export function DirectoryPanel({
  activeDirectory,
  tree,
  loading,
  error,
  selectedPath,
  onSelectFile,
  onManageDirectories,
  onRescan,
  onEnterDiffMode,
  onEnterGitDiffMode,
}: DirectoryPanelProps) {
  const { menu, importFailures, closeImportFailures, openNodeMenu, closeMenu } =
    useTreeContextMenu({
      activeDirectory,
      enableCreateScript: true,
      onRescan,
    })

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <SidebarIconBar>
          <IconButton
            onClick={onManageDirectories}
            aria-label="ディレクトリを追加・編集"
          >
            <FolderCog size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={onRescan}
            disabled={!activeDirectory || loading}
            aria-label="再読込"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={onEnterDiffMode}
            disabled={!activeDirectory}
            aria-label="フォルダ比較"
            title="フォルダ比較"
          >
            <GitCompare size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={onEnterGitDiffMode}
            disabled={!activeDirectory}
            aria-label="Git 履歴比較"
            title="Git 履歴比較"
          >
            <GitBranch size={16} aria-hidden="true" />
          </IconButton>
        </SidebarIconBar>
        {activeDirectory && (
          <p className={styles.root} title={activeDirectory}>
            {truncateMiddle(activeDirectory, 48)}
          </p>
        )}
      </div>

      <div className={styles.body}>
        {!activeDirectory && (
          <p className={styles.empty}>
            左のパネル上部から参照ディレクトリを追加してください。
          </p>
        )}
        {activeDirectory && loading && (
          <p className={styles.empty}>スキャン中...</p>
        )}
        {error && <p className={styles.error}>{error}</p>}
        {activeDirectory && !loading && !error && tree && tree.children.length === 0 && (
          <p className={styles.empty}>
            *.table.json が見つかりませんでした。
          </p>
        )}
        {activeDirectory && !loading && !error && tree && tree.children.length > 0 && (
          <div className={styles.tree}>
            <TreeNode
              node={tree}
              selectedPath={selectedPath}
              onSelect={onSelectFile}
              onNodeContextMenu={openNodeMenu}
            />
          </div>
        )}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={closeMenu}
        />
      )}
      <AlertDialog
        open={importFailures !== null}
        title="インポートに失敗しました"
        message={
          importFailures
            ? `${importFailures.length} 件のファイルを変換できませんでした。`
            : ''
        }
        items={importFailures?.map((failure) => ({
          label: failure.sourcePath,
          detail: failure.message,
        }))}
        onClose={closeImportFailures}
      />
    </aside>
  )
}
