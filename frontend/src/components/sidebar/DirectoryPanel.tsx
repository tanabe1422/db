import type { TreeNode as TreeNodeType } from '../../types'
import { useTreeContextMenu } from '../../hooks/useTreeContextMenu'
import { AlertDialog } from '../ui/AlertDialog'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ContextMenu } from '../ui/ContextMenu'
import { PromptDialog } from '../ui/PromptDialog'

import styles from './DirectoryPanel.module.css'
import { TreeNode } from './TreeNode'

interface DirectoryPanelProps {
  activeDirectory: string
  tree: TreeNodeType | null
  loading: boolean
  error: string | null
  selectedPath?: string
  onSelectFile?: (path: string) => void
  onRescan?: () => void
}

export function DirectoryPanel({
  activeDirectory,
  tree,
  loading,
  error,
  selectedPath,
  onSelectFile,
  onRescan,
}: DirectoryPanelProps) {
  const {
    menu,
    importFailures,
    prompt,
    deleteConfirm,
    closeImportFailures,
    openNodeMenu,
    closeMenu,
    closePrompt,
    closeDeleteConfirm,
    confirmDelete,
  } = useTreeContextMenu({
    activeDirectory,
    enableCreateScript: true,
    enableFileOperations: true,
    onRescan,
  })

  return (
    <>
      <div className={styles.root}>
        <div className={styles.scroll}>
        {!activeDirectory && (
          <p className={styles.empty}>
            上部のフォルダボタンから参照ディレクトリを追加してください。
          </p>
        )}
        {activeDirectory && loading && !tree && (
          <p className={styles.empty}>スキャン中...</p>
        )}
        {error && <p className={styles.error}>{error}</p>}
        {activeDirectory && !error && tree && (
          <>
            {tree.children.length === 0 && (
              <p className={styles.empty}>
                対象ファイル（*.table.json / *.sql / *.xlsx）が見つかりませんでした。ルートを右クリックして作成できます。
              </p>
            )}
            <div className={styles.tree}>
              <TreeNode
                node={tree}
                rootDirectory={activeDirectory}
                selectedPath={selectedPath}
                onSelect={onSelectFile}
                onNodeContextMenu={openNodeMenu}
              />
            </div>
          </>
        )}
        </div>
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
      <PromptDialog
        open={prompt !== null}
        title={prompt?.title ?? ''}
        label={prompt?.label}
        defaultValue={prompt?.defaultValue}
        onConfirm={(value) => {
          void prompt?.onSubmit(value)
          closePrompt()
        }}
        onCancel={closePrompt}
      />
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="ファイルを削除"
        message={
          deleteConfirm
            ? `「${deleteConfirm.name}」を削除しますか？この操作は元に戻せません。`
            : ''
        }
        confirmLabel="削除"
        onConfirm={() => {
          void confirmDelete()
        }}
        onCancel={closeDeleteConfirm}
      />
    </>
  )
}
