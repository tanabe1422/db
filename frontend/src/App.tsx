import { useCallback, useState } from 'react'
import { useAppZoom } from './hooks/useAppZoom'
import { MainLayout } from './components/layout/MainLayout'
import { EditToolbar } from './components/toolbar/EditToolbar'
import {
  emptyEditorToolbarBridge,
  type EditorToolbarBridge,
} from './components/toolbar/editorToolbarBridge'
import { OpenTerminalButton } from './components/toolbar/OpenTerminalButton'
import { WorkspaceToolbar } from './components/toolbar/WorkspaceToolbar'
import { DirectoryPanel } from './components/sidebar/DirectoryPanel'
import {
  SidebarPanelLayout,
  type SidebarMode,
} from './components/sidebar/SidebarPanelLayout'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { TabBar } from './components/tabs/TabBar'
import { DiffSetupPanel } from './components/diff/DiffSetupPanel'
import { DiffWorkspace } from './components/diff/DiffWorkspace'
import { GitDiffSetupPanel } from './components/diff/GitDiffSetupPanel'
import { GitDiffWorkspace } from './components/diff/GitDiffWorkspace'
import { WorkspaceFilePanel } from './components/workspace/WorkspaceFilePanel'
import { useDirectoryScan } from './hooks/useDirectoryScan'
import { useOpenTerminal } from './hooks/useOpenTerminal'
import { useSettings } from './hooks/useSettings'
import { useGenBatchProgress } from './hooks/useGenBatchProgress'
import { useTabWorkspace } from './hooks/useTabWorkspace'
import { exportGitMigrateScripts, exportMigrateScripts } from './lib/scriptExport'
import { errorMessage } from './lib/errorMessage'
import type { GitCommit, TreeNode } from './types'
import { cx } from './utils/cx'
import { getTreeFileKindFromPath } from './utils/treeFileKind'
import styles from './App.module.css'

type AppMode = SidebarMode

function App() {
  useAppZoom()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<AppMode>('edit')
  const [editorBridge, setEditorBridge] = useState<EditorToolbarBridge>(
    emptyEditorToolbarBridge,
  )
  const [leftNode, setLeftNode] = useState<TreeNode | null>(null)
  const [rightNode, setRightNode] = useState<TreeNode | null>(null)
  const [leftCommit, setLeftCommit] = useState<GitCommit | null>(null)
  const [rightCommit, setRightCommit] = useState<GitCommit | null>(null)

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
    closeAllSavedTabs,
  } = useTabWorkspace()

  const { settings, addDirectory, removeDirectory, setActiveDirectory, moveDirectory } =
    useSettings()

  const { tree, loading, error, rescan } = useDirectoryScan(
    settings.activeDirectory,
  )

  const openTerminal = useOpenTerminal(settings.activeDirectory)
  const { runGenBatch, isRunning: genBatchRunning } = useGenBatchProgress()

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
      setLeftNode(null)
      setRightNode(null)
      setLeftCommit(null)
      setRightCommit(null)
      await rescan()
    },
    [setActiveDirectory, rescan, resetTabs],
  )

  const handleModeChange = useCallback((nextMode: AppMode) => {
    setMode(nextMode)
  }, [])

  const handleExportMigrateScripts = useCallback(() => {
    if (!settings.activeDirectory) {
      return
    }

    void runGenBatch({
      title: '変更スクリプトを生成中…',
      task: async (report) => {
        if (mode === 'git-diff') {
          if (!leftCommit || !rightCommit) {
            return
          }
          await exportGitMigrateScripts(
            settings.activeDirectory,
            leftCommit.hash,
            rightCommit.hash,
            report,
          )
          return
        }

        if (!leftNode || !rightNode) {
          return
        }
        await exportMigrateScripts(
          settings.activeDirectory,
          leftNode,
          rightNode,
          report,
        )
      },
    }).catch((err: unknown) => {
      window.alert(errorMessage(err, '変更スクリプトの生成に失敗しました'))
    })
  }, [
    mode,
    leftNode,
    rightNode,
    leftCommit,
    rightCommit,
    settings.activeDirectory,
    runGenBatch,
  ])

  const activeIsTextFile =
    activePath !== '' && getTreeFileKindFromPath(activePath) === 'sql'

  return (
    <>
      <MainLayout
        toolbar={
          <WorkspaceToolbar
            trailing={
              <OpenTerminalButton
                disabled={!settings.activeDirectory}
                onOpen={openTerminal}
              />
            }
          >
            {mode === 'edit' && (
              <EditToolbar
                editor={editorBridge.editor}
                onSave={editorBridge.onSave}
              />
            )}
          </WorkspaceToolbar>
        }
        sidebar={
          <SidebarPanelLayout
            mode={mode}
            activeDirectory={settings.activeDirectory}
            loading={loading}
            onManageDirectories={() => setSettingsOpen(true)}
            onRescan={() => void rescan()}
            onModeChange={handleModeChange}
          >
            {mode === 'diff' ? (
              <DiffSetupPanel
                activeDirectory={settings.activeDirectory}
                tree={tree}
                leftPath={leftNode?.path}
                rightPath={rightNode?.path}
                onSelectLeft={setLeftNode}
                onSelectRight={setRightNode}
              />
            ) : mode === 'git-diff' ? (
              <GitDiffSetupPanel
                activeDirectory={settings.activeDirectory}
                leftHash={leftCommit?.hash}
                rightHash={rightCommit?.hash}
                onSelectLeft={setLeftCommit}
                onSelectRight={setRightCommit}
              />
            ) : (
              <DirectoryPanel
                activeDirectory={settings.activeDirectory}
                tree={tree}
                loading={loading}
                error={error}
                selectedPath={activePath}
                onSelectFile={handleSelectFile}
                onRescan={() => void rescan()}
              />
            )}
          </SidebarPanelLayout>
        }
        >
          {mode === 'diff' ? (
            <div className={styles.workspace}>
              <div className={styles.content}>
                <DiffWorkspace
                  activeDirectory={settings.activeDirectory}
                  leftNode={leftNode}
                  rightNode={rightNode}
                  migrateScriptExport={{
                    onClick: handleExportMigrateScripts,
                    disabled: !leftNode || !rightNode || genBatchRunning,
                  }}
                />
              </div>
            </div>
          ) : mode === 'git-diff' ? (
            <div className={styles.workspace}>
              <div className={styles.content}>
                <GitDiffWorkspace
                  activeDirectory={settings.activeDirectory}
                  leftCommit={leftCommit}
                  rightCommit={rightCommit}
                  migrateScriptExport={{
                    onClick: handleExportMigrateScripts,
                    disabled: !leftCommit || !rightCommit || genBatchRunning,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.workspace}>
              {openPaths.length > 0 && (
                <TabBar
                  paths={openPaths}
                  activePath={activePath}
                  dirtyPaths={dirtyPaths}
                  activeDirectory={settings.activeDirectory}
                  onActivate={setActivePath}
                  onClose={handleRequestClose}
                  onCloseAllSaved={closeAllSavedTabs}
                />
              )}
              <div className={cx(styles.content, activeIsTextFile && styles.contentText)}>
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
                      <WorkspaceFilePanel
                        path={path}
                        isActive={path === activePath}
                        inlineToolbar={false}
                        onDirtyChange={(dirty) => updateDirty(path, dirty)}
                        onEditorBridgeChange={setEditorBridge}
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
        onMove={(path, offset) => void moveDirectory(path, offset)}
        onAISetupComplete={() => void rescan()}
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
