import { useCallback, useState } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { DirectoryPanel } from './components/sidebar/DirectoryPanel'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { TabBar } from './components/tabs/TabBar'
import { DiffSetupPanel } from './components/diff/DiffSetupPanel'
import { DiffWorkspace } from './components/diff/DiffWorkspace'
import { TableDefinitionPanel } from './components/workspace/TableDefinitionPanel'
import { useDirectoryScan } from './hooks/useDirectoryScan'
import { useSettings } from './hooks/useSettings'
import { useTabWorkspace } from './hooks/useTabWorkspace'
import type { TreeNode } from './types'
import styles from './App.module.css'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<'edit' | 'diff'>('edit')
  const [leftNode, setLeftNode] = useState<TreeNode | null>(null)
  const [rightNode, setRightNode] = useState<TreeNode | null>(null)

  const {
    openPaths,
    activePath,
    dirtyPaths,
    closingPath,
    setActivePath,
    handleSelectFile,
    updateDirty,
    handleRequestClose,
    handleConfirmClose,
    handleCancelClose,
    resetTabs,
  } = useTabWorkspace()

  const { settings, addDirectory, removeDirectory, setActiveDirectory } =
    useSettings()

  const { tree, loading, error, rescan } = useDirectoryScan(
    settings.activeDirectory,
  )

  const handleAdd = useCallback(async () => {
    await addDirectory()
    await rescan()
  }, [addDirectory, rescan])

  const handleRemove = useCallback(
    async (path: string) => {
      await removeDirectory(path)
      await rescan()
    },
    [removeDirectory, rescan],
  )

  const handleSetActive = useCallback(
    async (path: string) => {
      await setActiveDirectory(path)
      resetTabs()
      await rescan()
    },
    [setActiveDirectory, rescan, resetTabs],
  )

  const enterDiffMode = useCallback(() => {
    setMode('diff')
  }, [])

  const exitDiffMode = useCallback(() => {
    setMode('edit')
    setLeftNode(null)
    setRightNode(null)
  }, [])

  return (
    <>
      <MainLayout
        onOpenSettings={() => setSettingsOpen(true)}
        sidebar={
          mode === 'diff' ? (
            <DiffSetupPanel
              activeDirectory={settings.activeDirectory}
              tree={tree}
              leftPath={leftNode?.path}
              rightPath={rightNode?.path}
              onSelectLeft={setLeftNode}
              onSelectRight={setRightNode}
              onExitDiff={exitDiffMode}
            />
          ) : (
            <DirectoryPanel
              activeDirectory={settings.activeDirectory}
              tree={tree}
              loading={loading}
              error={error}
              selectedPath={activePath}
              onSelectFile={handleSelectFile}
              onManageDirectories={() => setSettingsOpen(true)}
              onRescan={() => void rescan()}
              onEnterDiffMode={enterDiffMode}
            />
          )
        }
      >
        {mode === 'diff' ? (
          <div className={styles.workspace}>
            <div className={styles.content}>
              <DiffWorkspace leftNode={leftNode} rightNode={rightNode} />
            </div>
          </div>
        ) : (
          <div className={styles.workspace}>
            {openPaths.length > 0 && (
              <TabBar
                paths={openPaths}
                activePath={activePath}
                dirtyPaths={dirtyPaths}
                onActivate={setActivePath}
                onClose={handleRequestClose}
              />
            )}
            <div className={styles.content}>
              {openPaths.length === 0 ? (
                <div className={styles.placeholder}>
                  <h2>テーブル定義を選択</h2>
                  <p>左のパネルから *.table.json ファイルを選択してください。</p>
                </div>
              ) : (
                openPaths.map((path) => (
                  <div
                    key={path}
                    className={styles.panel}
                    style={{ display: path === activePath ? 'block' : 'none' }}
                  >
                    <TableDefinitionPanel
                      path={path}
                      onDirtyChange={(dirty) => updateDirty(path, dirty)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </MainLayout>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onAdd={() => void handleAdd()}
        onRemove={(path) => void handleRemove(path)}
        onSetActive={(path) => void handleSetActive(path)}
      />

      <ConfirmDialog
        open={closingPath !== null}
        title="未保存の変更"
        message="未保存の変更があります。このタブを閉じますか？"
        confirmLabel="閉じる"
        cancelLabel="キャンセル"
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  )
}

export default App
